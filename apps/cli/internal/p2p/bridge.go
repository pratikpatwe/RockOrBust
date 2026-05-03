package p2p

import (
	"encoding/json"
	"log"

	"github.com/pion/webrtc/v4"
	"github.com/pratikpatwe/RockOrBust/cli/internal/protocol"
)

// Bridge connects a P2P DataChannel session to the existing proxy handler.
// It translates DataChannel messages into the same protocol the proxy handler
// already understands, so the actual HTTP/CONNECT logic is fully reused.
type Bridge struct {
	sessions     *SessionManager
	proxyHandler ProxyDispatcher
}

// ProxyDispatcher is the interface that the existing proxy.Handler satisfies.
// It processes incoming proxy request messages and sends responses back
// through the provided sender function.
type ProxyDispatcher interface {
	// HandleP2PMessage processes a raw JSON message from a P2P DataChannel.
	// The sender function is used to send response data back over the DataChannel.
	HandleP2PMessage(raw []byte, sender func(data []byte) error)

	// HandleBinaryP2PMessage processes a binary frame from a P2P DataChannel.
	HandleBinaryP2PMessage(raw []byte, sender func(data []byte) error)
}

// NewBridge creates a Bridge that connects P2P sessions to the proxy handler.
func NewBridge(sessions *SessionManager, handler ProxyDispatcher) *Bridge {
	return &Bridge{
		sessions:     sessions,
		proxyHandler: handler,
	}
}

// OnDataChannelMessage is the callback that gets wired into SessionManager.HandleOffer.
// It dispatches incoming DataChannel messages to the proxy handler.
func (b *Bridge) OnDataChannelMessage(session *Session, data []byte) {
	// Create a sender function that writes responses back over the DataChannel
	sender := func(responseData []byte) error {
		return b.sessions.SendMessage(session.ID, responseData)
	}

	if len(data) > 0 && data[0] == '{' {
		// Legacy JSON protocol
		b.proxyHandler.HandleP2PMessage(data, sender)
	} else {
		// New high-efficiency binary protocol
		b.proxyHandler.HandleBinaryP2PMessage(data, sender)
	}
}

// HandleSignalingOffer is the top-level handler called from the WebSocket client
// when a SIGNALING_OFFER message arrives from the Gateway.
// It returns the signaling answer to send back.
func (b *Bridge) HandleSignalingOffer(msg protocol.SignalingOfferMessage) (*protocol.SignalingAnswerMessage, error) {
	// Convert []any to []webrtc.ICEServer
	var iceServers []webrtc.ICEServer
	if msg.ICEServers != nil {
		iceData, _ := json.Marshal(msg.ICEServers)
		json.Unmarshal(iceData, &iceServers)
	}

	sdpAnswer, candidates, err := b.sessions.HandleOffer(
		msg.SessionID,
		msg.SDP,
		msg.Candidates,
		iceServers,
		b.OnDataChannelMessage,
	)
	if err != nil {
		return nil, err
	}

	answer := &protocol.SignalingAnswerMessage{
		Type:       "SIGNALING_ANSWER",
		SessionID:  msg.SessionID,
		SDP:        sdpAnswer,
		Candidates: candidates,
	}

	log.Printf("[p2p] Signaling answer created for session %s (%d ICE candidates)", msg.SessionID, len(candidates))

	return answer, nil
}

// SendJSON is a convenience function for sending a JSON-encoded response
// over a P2P DataChannel.
func SendJSON(session *Session, sm *SessionManager, msg any) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	return sm.SendMessage(session.ID, data)
}
