package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/url"
	"os"
	"time"

	"github.com/gorilla/websocket"
)

const (
	backoffMin = 2 * time.Second
	backoffMax = 60 * time.Second

	// Heartbeat interval to match the gateway's 30-second ping.
	pongWait   = 60 * time.Second
	pingPeriod = 30 * time.Second
)

// MessageHandler is a function that processes an incoming message from the gateway.
// It is called in a goroutine for every message received.
type MessageHandler func(conn *websocket.Conn, raw []byte)

// Client manages the WebSocket connection to the gateway.
type Client struct {
	gatewayURL string
	key        string
	hostname   string
	handler    MessageHandler
	quit       chan struct{}
}

// NewClient creates a new WebSocket client.
func NewClient(gatewayURL, key string, handler MessageHandler) (*Client, error) {
	hostname, err := os.Hostname()
	if err != nil {
		return nil, fmt.Errorf("could not determine hostname: %w", err)
	}

	return &Client{
		gatewayURL: gatewayURL,
		key:        key,
		hostname:   hostname,
		handler:    handler,
		quit:       make(chan struct{}),
	}, nil
}

// Run starts the connection loop. It blocks until Stop() is called.
// On any disconnect, it reconnects with exponential backoff.
func (c *Client) Run() {
	backoff := backoffMin

	for {
		// Check if we've been asked to stop before attempting a connection
		select {
		case <-c.quit:
			return
		default:
		}

		log.Printf("[ws] connecting to %s as %s...", c.gatewayURL, c.hostname)

		conn, err := c.connect()
		if err != nil {
			log.Printf("[ws] connection failed: %v — retrying in %s", err, backoff)
			select {
			case <-time.After(backoff):
			case <-c.quit:
				return
			}
			backoff = nextBackoff(backoff)
			continue
		}

		log.Printf("[ws] connected to gateway ✓")
		backoff = backoffMin // Reset backoff on successful connection

		// Block here until the connection drops
		c.readLoop(conn)

		// Connection dropped — check if we should stop or retry
		select {
		case <-c.quit:
			return
		default:
			log.Printf("[ws] disconnected — retrying in %s", backoff)
			select {
			case <-time.After(backoff):
			case <-c.quit:
				return
			}
			backoff = nextBackoff(backoff)
		}
	}
}

// Stop signals the client to stop reconnecting and shut down cleanly.
func (c *Client) Stop() {
	close(c.quit)
}

// connect builds the WebSocket URL, dials the gateway, and returns a live connection.
func (c *Client) connect() (*websocket.Conn, error) {
	u, err := url.Parse(c.gatewayURL)
	if err != nil {
		return nil, fmt.Errorf("invalid gateway URL: %w", err)
	}

	// Attach key and hostname as query params (matches gateway expectations)
	q := u.Query()
	q.Set("key", c.key)
	q.Set("hostname", c.hostname)
	u.RawQuery = q.Encode()

	conn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		return nil, err
	}

	// Set up pong handler to keep the connection alive against the gateway's pings
	conn.SetReadDeadline(time.Now().Add(pongWait))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	return conn, nil
}

// readLoop reads messages from the connection and dispatches them to the handler.
// It returns when the connection is closed or an error occurs.
func (c *Client) readLoop(conn *websocket.Conn) {
	defer conn.Close()

	// Start the ping ticker to keep the connection alive
	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()

	// Start the latency reporter to send speed metrics to the gateway
	go c.reportLatency(conn)

	done := make(chan struct{})

	// Goroutine to send pings
	go func() {
		defer close(done)
		for {
			select {
			case <-ticker.C:
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					return
				}
			case <-c.quit:
				conn.WriteMessage(websocket.CloseMessage,
					websocket.FormatCloseMessage(websocket.CloseNormalClosure, "shutting down"))
				return
			}
		}
	}()

	// Read messages in the main goroutine
	for {
		_, raw, err := conn.ReadMessage()
		if err != nil {
			if !websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				log.Printf("[ws] read error: %v", err)
			}
			return
		}

		// Dispatch each message in its own goroutine so one slow
		// request doesn't block the entire read loop.
		go c.handler(conn, raw)
	}
}

// nextBackoff doubles the duration, capped at backoffMax.
func nextBackoff(current time.Duration) time.Duration {
	next := current * 2
	if next > backoffMax {
		return backoffMax
	}
	return next
}

// SendMessage is a convenience helper for sending a JSON-encoded message back to the gateway.
func SendMessage(conn *websocket.Conn, msg any) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to serialize message: %w", err)
	}
	return conn.WriteMessage(websocket.TextMessage, data)
}

// reportLatency periodically measures latency and sends it to the gateway.
func (c *Client) reportLatency(conn *websocket.Conn) {
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			start := time.Now()
			// Use a standard target for latency measurement (Cloudflare DNS)
			dialer := net.Dialer{Timeout: 5 * time.Second}
			conn_test, err := dialer.Dial("tcp", "1.1.1.1:443")
			if err == nil {
				latency := time.Since(start).Milliseconds()
				conn_test.Close()
				SendMessage(conn, map[string]interface{}{
					"type": "latency",
					"ms":   latency,
				})
			}
		case <-c.quit:
			return
		}
	}
}
