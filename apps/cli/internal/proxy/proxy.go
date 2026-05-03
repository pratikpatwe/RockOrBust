package proxy

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pratikpatwe/RockOrBust/cli/internal/protocol"
)

// --- Handler ---

// Handler manages active CONNECT tunnels and dispatches incoming messages.
type Handler struct {
	mu      sync.Mutex
	tunnels map[string]net.Conn // requestID → active TCP connection

	// Shared HTTP client — reused across requests for connection pooling.
	httpClient *http.Client
}

// NewHandler creates a new proxy Handler.
func NewHandler() *Handler {
	return &Handler{
		tunnels: make(map[string]net.Conn),
		httpClient: &http.Client{
			// Do not follow redirects — the browser on the other end handles that.
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
			Timeout: 30 * time.Second,
		},
	}
}

// Handle is the MessageHandler signature expected by ws.NewClient.
// It parses the message type and dispatches to the appropriate handler.
func (h *Handler) Handle(conn *websocket.Conn, raw []byte) {
	var base protocol.BaseMessage
	if err := json.Unmarshal(raw, &base); err != nil {
		log.Printf("[proxy] failed to parse message: %v", err)
		return
	}

	// Create a sender that writes responses over the WebSocket
	sender := func(data []byte) error {
		return conn.WriteMessage(websocket.TextMessage, data)
	}

	switch base.Type {
	case "HTTP_REQUEST":
		var msg protocol.HTTPRequestMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			h.sendErrorWith(sender, base.ID, "failed to parse HTTP_REQUEST")
			return
		}
		go h.handleHTTPRequest(sender, msg)

	case "CONNECT_REQUEST":
		var msg protocol.ConnectRequestMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			h.sendErrorWith(sender, base.ID, "failed to parse CONNECT_REQUEST")
			return
		}
		go h.handleConnectRequest(sender, msg)

	case "CONNECT_DATA":
		var msg protocol.ConnectDataMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			return
		}
		h.handleConnectData(msg)

	case "CONNECT_CLOSE":
		var msg protocol.ConnectCloseMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			return
		}
		h.handleConnectClose(msg.ID)

	default:
		log.Printf("[proxy] unknown message type: %s", base.Type)
	}
}

// HandleP2PMessage implements the p2p.ProxyDispatcher interface.
// It processes messages arriving over a WebRTC DataChannel using
// the exact same proxy logic as the WebSocket path.
func (h *Handler) HandleP2PMessage(raw []byte, sender func(data []byte) error) {
	var base protocol.BaseMessage
	if err := json.Unmarshal(raw, &base); err != nil {
		log.Printf("[proxy/p2p] failed to parse message: %v", err)
		return
	}

	switch base.Type {
	case "HTTP_REQUEST":
		var msg protocol.HTTPRequestMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			h.sendErrorWith(sender, base.ID, "failed to parse HTTP_REQUEST")
			return
		}
		go h.handleHTTPRequest(sender, msg)

	case "CONNECT_REQUEST":
		var msg protocol.ConnectRequestMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			h.sendErrorWith(sender, base.ID, "failed to parse CONNECT_REQUEST")
			return
		}
		go h.handleConnectRequest(sender, msg)

	case "CONNECT_DATA":
		var msg protocol.ConnectDataMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			return
		}
		h.handleConnectData(msg)

	case "CONNECT_CLOSE":
		var msg protocol.ConnectCloseMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			return
		}
		h.handleConnectClose(msg.ID)

	default:
		log.Printf("[proxy/p2p] unknown message type: %s", base.Type)
	}
}

// handleHTTPRequest performs a real HTTP request on behalf of the gateway or SDK.
func (h *Handler) handleHTTPRequest(sender func([]byte) error, msg protocol.HTTPRequestMessage) {
	var bodyReader io.Reader
	if msg.Body != nil {
		decoded, err := base64.StdEncoding.DecodeString(*msg.Body)
		if err != nil {
			h.sendErrorWith(sender, msg.ID, "failed to decode request body")
			return
		}
		bodyReader = bytes.NewReader(decoded)
	}

	req, err := http.NewRequest(msg.Method, msg.URL, bodyReader)
	if err != nil {
		h.sendErrorWith(sender, msg.ID, "failed to build HTTP request: "+err.Error())
		return
	}

	// Forward headers from gateway
	for k, v := range msg.Headers {
		req.Header.Set(k, v)
	}

	resp, err := h.httpClient.Do(req)
	if err != nil {
		h.sendErrorWith(sender, msg.ID, "HTTP request failed: "+err.Error())
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		h.sendErrorWith(sender, msg.ID, "failed to read response body: "+err.Error())
		return
	}

	// Flatten response headers to map[string]string (first value only)
	headers := make(map[string]string, len(resp.Header))
	for k, vals := range resp.Header {
		if len(vals) > 0 {
			headers[k] = vals[0]
		}
	}

	reply := protocol.HTTPResponseMessage{
		Type:    "HTTP_RESPONSE",
		ID:      msg.ID,
		Status:  resp.StatusCode,
		Headers: headers,
		Body:    base64.StdEncoding.EncodeToString(respBody),
	}

	data, err := json.Marshal(reply)
	if err != nil {
		log.Printf("[proxy] failed to serialize HTTP_RESPONSE: %v", err)
		return
	}

	if err := sender(data); err != nil {
		log.Printf("[proxy] failed to send HTTP_RESPONSE: %v", err)
	}
}

// handleConnectRequest opens a raw TCP connection and signals the caller.
func (h *Handler) handleConnectRequest(sender func([]byte) error, msg protocol.ConnectRequestMessage) {
	tcpConn, err := net.DialTimeout("tcp", msg.URL, 10*time.Second)
	if err != nil {
		h.sendErrorWith(sender, msg.ID, "failed to connect to "+msg.URL+": "+err.Error())
		return
	}

	h.mu.Lock()
	h.tunnels[msg.ID] = tcpConn
	h.mu.Unlock()

	// Tell the caller the tunnel is open
	established := protocol.ConnectEstablishedMessage{Type: "CONNECT_ESTABLISHED", ID: msg.ID}
	data, _ := json.Marshal(established)
	if err := sender(data); err != nil {
		log.Printf("[proxy] failed to send CONNECT_ESTABLISHED: %v", err)
		tcpConn.Close()
		return
	}

	// Forward any data coming back FROM the target server TO the caller
	go func() {
		defer func() {
			h.handleConnectClose(msg.ID)
			closeMsg := protocol.ConnectDataOutMessage{Type: "CONNECT_CLOSE", ID: msg.ID}
			closeData, _ := json.Marshal(closeMsg)
			sender(closeData)
		}()

		buf := make([]byte, 32*1024)
		for {
			n, err := tcpConn.Read(buf)
			if n > 0 {
				outMsg := protocol.ConnectDataOutMessage{
					Type: "CONNECT_DATA",
					ID:   msg.ID,
					Data: base64.StdEncoding.EncodeToString(buf[:n]),
				}
				outData, _ := json.Marshal(outMsg)
				sender(outData)
			}
			if err != nil {
				return
			}
		}
	}()
}

// handleConnectData forwards raw data from the caller through the open TCP tunnel.
func (h *Handler) handleConnectData(msg protocol.ConnectDataMessage) {
	h.mu.Lock()
	tcpConn, ok := h.tunnels[msg.ID]
	h.mu.Unlock()

	if !ok {
		log.Printf("[proxy] CONNECT_DATA for unknown tunnel: %s", msg.ID)
		return
	}

	data, err := base64.StdEncoding.DecodeString(msg.Data)
	if err != nil {
		log.Printf("[proxy] failed to decode CONNECT_DATA: %v", err)
		return
	}

	if _, err := tcpConn.Write(data); err != nil {
		log.Printf("[proxy] failed to write to tunnel %s: %v", msg.ID, err)
	}
}

// handleConnectClose tears down the TCP tunnel for the given request ID.
func (h *Handler) handleConnectClose(id string) {
	h.mu.Lock()
	tcpConn, ok := h.tunnels[id]
	if ok {
		delete(h.tunnels, id)
	}
	h.mu.Unlock()

	if ok {
		tcpConn.Close()
	}
}

// sendErrorWith sends an ERROR message using the provided sender function.
func (h *Handler) sendErrorWith(sender func([]byte) error, id, message string) {
	log.Printf("[proxy] error for request %s: %s", id, message)
	errMsg := protocol.ErrorMessage{
		Type:    "ERROR",
		ID:      id,
		Message: message,
	}
	data, _ := json.Marshal(errMsg)
	sender(data)
}


