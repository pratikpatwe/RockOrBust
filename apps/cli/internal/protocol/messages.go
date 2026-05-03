// Package protocol defines the shared message types used by both
// the WebSocket tunnel and the WebRTC DataChannel proxy paths.
package protocol

// --- Incoming message types (Gateway/SDK → CLI) ---

// BaseMessage is used to peek at the "type" field before full deserialization.
type BaseMessage struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

// HTTPRequestMessage represents a forwarded HTTP request.
type HTTPRequestMessage struct {
	Type    string            `json:"type"`
	ID      string            `json:"id"`
	Method  string            `json:"method"`
	URL     string            `json:"url"`
	Headers map[string]string `json:"headers"`
	Body    *string           `json:"body"` // base64 encoded, nullable
}

// ConnectRequestMessage represents a forwarded HTTPS CONNECT request.
type ConnectRequestMessage struct {
	Type string `json:"type"`
	ID   string `json:"id"`
	URL  string `json:"url"` // e.g. "google.com:443"
}

// ConnectDataMessage carries raw tunnel data (base64 encoded).
type ConnectDataMessage struct {
	Type string `json:"type"`
	ID   string `json:"id"`
	Data string `json:"data"` // base64 encoded
}

// ConnectCloseMessage signals that a CONNECT tunnel should be torn down.
type ConnectCloseMessage struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

// --- Outgoing message types (CLI → Gateway/SDK) ---

// HTTPResponseMessage is the reply to an HTTPRequestMessage.
type HTTPResponseMessage struct {
	Type    string            `json:"type"`
	ID      string            `json:"id"`
	Status  int               `json:"status"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"` // base64 encoded
}

// ConnectEstablishedMessage confirms a CONNECT tunnel was opened.
type ConnectEstablishedMessage struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

// ConnectDataOutMessage carries raw tunnel data back to the caller.
type ConnectDataOutMessage struct {
	Type string `json:"type"`
	ID   string `json:"id"`
	Data string `json:"data"` // base64 encoded
}

// ErrorMessage reports an error for a specific request.
type ErrorMessage struct {
	Type    string `json:"type"`
	ID      string `json:"id"`
	Message string `json:"message"`
}

// --- Signaling message types (Gateway ↔ CLI, for WebRTC negotiation) ---

// SignalingOfferMessage is sent by the Gateway to request a WebRTC session.
type SignalingOfferMessage struct {
	Type       string   `json:"type"`       // "SIGNALING_OFFER"
	SessionID  string   `json:"sessionId"`  // Unique session identifier
	SDP        string   `json:"sdp"`        // SDP offer from the SDK
	Candidates []string `json:"candidates"` // ICE candidates from the SDK
}

// SignalingAnswerMessage is the CLI's response to a signaling offer.
type SignalingAnswerMessage struct {
	Type       string   `json:"type"`       // "SIGNALING_ANSWER"
	SessionID  string   `json:"sessionId"`  // Must match the offer's sessionId
	SDP        string   `json:"sdp"`        // SDP answer from the CLI
	Candidates []string `json:"candidates"` // ICE candidates from the CLI
}
