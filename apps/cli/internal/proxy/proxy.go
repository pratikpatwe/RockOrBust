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
	ws "github.com/pratikpatwe/RockOrBust/cli/internal/ws"
)

// --- Incoming message types (Gateway → CLI) ---

type incomingMessage struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

type httpRequestMessage struct {
	Type    string            `json:"type"`
	ID      string            `json:"id"`
	Method  string            `json:"method"`
	URL     string            `json:"url"`
	Headers map[string]string `json:"headers"`
	Body    *string           `json:"body"` // base64 encoded, nullable
}

type connectRequestMessage struct {
	Type string `json:"type"`
	ID   string `json:"id"`
	URL  string `json:"url"` // e.g. "google.com:443"
}

type connectDataMessage struct {
	Type string `json:"type"`
	ID   string `json:"id"`
	Data string `json:"data"` // base64 encoded
}

type connectCloseMessage struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

// --- Outgoing message types (CLI → Gateway) ---

type httpResponseMessage struct {
	Type    string            `json:"type"`
	ID      string            `json:"id"`
	Status  int               `json:"status"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"` // base64 encoded
}

type connectEstablishedMessage struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

type connectDataOutMessage struct {
	Type string `json:"type"`
	ID   string `json:"id"`
	Data string `json:"data"` // base64 encoded
}

type errorMessage struct {
	Type    string `json:"type"`
	ID      string `json:"id"`
	Message string `json:"message"`
}

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
	var base incomingMessage
	if err := json.Unmarshal(raw, &base); err != nil {
		log.Printf("[proxy] failed to parse message: %v", err)
		return
	}

	switch base.Type {
	case "HTTP_REQUEST":
		var msg httpRequestMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			h.sendError(conn, base.ID, "failed to parse HTTP_REQUEST")
			return
		}
		go h.handleHTTPRequest(conn, msg)

	case "CONNECT_REQUEST":
		var msg connectRequestMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			h.sendError(conn, base.ID, "failed to parse CONNECT_REQUEST")
			return
		}
		go h.handleConnectRequest(conn, msg)

	case "CONNECT_DATA":
		var msg connectDataMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			return
		}
		h.handleConnectData(msg)

	case "CONNECT_CLOSE":
		var msg connectCloseMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			return
		}
		h.handleConnectClose(msg.ID)

	default:
		log.Printf("[proxy] unknown message type: %s", base.Type)
	}
}

// handleHTTPRequest performs a real HTTP request on behalf of the gateway.
func (h *Handler) handleHTTPRequest(conn *websocket.Conn, msg httpRequestMessage) {
	var bodyReader io.Reader
	if msg.Body != nil {
		decoded, err := base64.StdEncoding.DecodeString(*msg.Body)
		if err != nil {
			h.sendError(conn, msg.ID, "failed to decode request body")
			return
		}
		bodyReader = bytes.NewReader(decoded)
	}

	req, err := http.NewRequest(msg.Method, msg.URL, bodyReader)
	if err != nil {
		h.sendError(conn, msg.ID, "failed to build HTTP request: "+err.Error())
		return
	}

	// Forward headers from gateway
	for k, v := range msg.Headers {
		req.Header.Set(k, v)
	}

	resp, err := h.httpClient.Do(req)
	if err != nil {
		h.sendError(conn, msg.ID, "HTTP request failed: "+err.Error())
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		h.sendError(conn, msg.ID, "failed to read response body: "+err.Error())
		return
	}

	// Flatten response headers to map[string]string (first value only)
	headers := make(map[string]string, len(resp.Header))
	for k, vals := range resp.Header {
		if len(vals) > 0 {
			headers[k] = vals[0]
		}
	}

	reply := httpResponseMessage{
		Type:    "HTTP_RESPONSE",
		ID:      msg.ID,
		Status:  resp.StatusCode,
		Headers: headers,
		Body:    base64.StdEncoding.EncodeToString(respBody),
	}

	if err := ws.SendMessage(conn, reply); err != nil {
		log.Printf("[proxy] failed to send HTTP_RESPONSE: %v", err)
	}
}

// handleConnectRequest opens a raw TCP connection and signals the gateway.
func (h *Handler) handleConnectRequest(conn *websocket.Conn, msg connectRequestMessage) {
	tcpConn, err := net.DialTimeout("tcp", msg.URL, 10*time.Second)
	if err != nil {
		h.sendError(conn, msg.ID, "failed to connect to "+msg.URL+": "+err.Error())
		return
	}

	h.mu.Lock()
	h.tunnels[msg.ID] = tcpConn
	h.mu.Unlock()

	// Tell the gateway the tunnel is open
	established := connectEstablishedMessage{Type: "CONNECT_ESTABLISHED", ID: msg.ID}
	if err := ws.SendMessage(conn, established); err != nil {
		log.Printf("[proxy] failed to send CONNECT_ESTABLISHED: %v", err)
		tcpConn.Close()
		return
	}

	// Forward any data coming back FROM the target server TO the gateway
	go func() {
		defer func() {
			h.handleConnectClose(msg.ID)
			ws.SendMessage(conn, connectDataOutMessage{Type: "CONNECT_CLOSE", ID: msg.ID})
		}()

		buf := make([]byte, 32*1024)
		for {
			n, err := tcpConn.Read(buf)
			if n > 0 {
				data := base64.StdEncoding.EncodeToString(buf[:n])
				ws.SendMessage(conn, connectDataOutMessage{
					Type: "CONNECT_DATA",
					ID:   msg.ID,
					Data: data,
				})
			}
			if err != nil {
				return
			}
		}
	}()
}

// handleConnectData forwards raw data from the gateway through the open TCP tunnel.
func (h *Handler) handleConnectData(msg connectDataMessage) {
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

// sendError sends an ERROR message back to the gateway.
func (h *Handler) sendError(conn *websocket.Conn, id, message string) {
	log.Printf("[proxy] error for request %s: %s", id, message)
	ws.SendMessage(conn, errorMessage{
		Type:    "ERROR",
		ID:      id,
		Message: message,
	})
}


