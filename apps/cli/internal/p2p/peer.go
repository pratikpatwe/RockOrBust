// Package p2p manages WebRTC PeerConnection lifecycle for direct
// SDK-to-CLI proxy tunneling, bypassing the Gateway data plane.
package p2p

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"github.com/pion/webrtc/v4"
)

// ICEConfig holds the STUN/TURN server configuration provided by the Gateway.
var ICEConfig = []webrtc.ICEServer{
	{URLs: []string{"stun:stun.l.google.com:19302"}},
}

// SetICEServers allows the Gateway to dynamically configure ICE servers
// (e.g., providing TURN credentials) via signaling messages.
func SetICEServers(servers []webrtc.ICEServer) {
	ICEConfig = servers
}

// Session represents a single active WebRTC peer connection with an SDK client.
type Session struct {
	ID             string
	PeerConnection *webrtc.PeerConnection
	DataChannel    *webrtc.DataChannel
	OnMessage      func(data []byte)
	mu             sync.Mutex
	closed         bool
}

// SessionManager tracks all active P2P sessions.
type SessionManager struct {
	mu       sync.RWMutex
	sessions map[string]*Session
}

// NewSessionManager creates a new SessionManager.
func NewSessionManager() *SessionManager {
	return &SessionManager{
		sessions: make(map[string]*Session),
	}
}

// HandleOffer processes a signaling offer from the Gateway, creates a
// PeerConnection, and returns the SDP answer + ICE candidates.
// The onMessage callback is invoked for every message received on the DataChannel.
func (sm *SessionManager) HandleOffer(sessionID, sdpOffer string, remoteCandidates []string, iceServers []webrtc.ICEServer, onMessage func(session *Session, data []byte)) (sdpAnswer string, localCandidates []string, err error) {
	config := webrtc.Configuration{
		ICEServers: ICEConfig,
	}

	// Use provided ICE servers if available
	if len(iceServers) > 0 {
		config.ICEServers = iceServers
	}

	// Create the PeerConnection
	pc, err := webrtc.NewPeerConnection(config)
	if err != nil {
		return "", nil, fmt.Errorf("failed to create PeerConnection: %w", err)
	}

	session := &Session{
		ID:             sessionID,
		PeerConnection: pc,
	}

	// Collect ICE candidates as they are discovered
	var candidateMu sync.Mutex
	var candidates []string
	candidatesDone := make(chan struct{})

	pc.OnICECandidate(func(c *webrtc.ICECandidate) {
		if c == nil {
			// Gathering complete
			close(candidatesDone)
			return
		}
		candidateMu.Lock()
		defer candidateMu.Unlock()

		candidateJSON, err := json.Marshal(c.ToJSON())
		if err == nil {
			candidates = append(candidates, string(candidateJSON))
		}
	})

	// Handle incoming DataChannel (created by the SDK/offerer)
	pc.OnDataChannel(func(dc *webrtc.DataChannel) {
		log.Printf("[p2p] DataChannel '%s' opened for session %s", dc.Label(), sessionID)
		session.DataChannel = dc

		dc.OnOpen(func() {
			log.Printf("[p2p] DataChannel ready for session %s", sessionID)
		})

		dc.OnMessage(func(msg webrtc.DataChannelMessage) {
			if onMessage != nil {
				onMessage(session, msg.Data)
			}
		})

		dc.OnClose(func() {
			log.Printf("[p2p] DataChannel closed for session %s", sessionID)
			sm.CloseSession(sessionID)
		})
	})

	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		log.Printf("[p2p] Connection state for session %s: %s", sessionID, state.String())
		if state == webrtc.PeerConnectionStateFailed || state == webrtc.PeerConnectionStateClosed {
			sm.CloseSession(sessionID)
		}
	})

	// Set the remote SDP offer
	offer := webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  sdpOffer,
	}
	if err := pc.SetRemoteDescription(offer); err != nil {
		pc.Close()
		return "", nil, fmt.Errorf("failed to set remote description: %w", err)
	}

	// Add remote ICE candidates
	for _, candStr := range remoteCandidates {
		var candidate webrtc.ICECandidateInit
		if err := json.Unmarshal([]byte(candStr), &candidate); err != nil {
			log.Printf("[p2p] warning: failed to parse remote ICE candidate: %v", err)
			continue
		}
		if err := pc.AddICECandidate(candidate); err != nil {
			log.Printf("[p2p] warning: failed to add remote ICE candidate: %v", err)
		}
	}

	// Create the SDP answer
	answer, err := pc.CreateAnswer(nil)
	if err != nil {
		pc.Close()
		return "", nil, fmt.Errorf("failed to create answer: %w", err)
	}

	if err := pc.SetLocalDescription(answer); err != nil {
		pc.Close()
		return "", nil, fmt.Errorf("failed to set local description: %w", err)
	}

	// Wait for ICE gathering to complete
	<-candidatesDone

	// Store the session
	sm.mu.Lock()
	sm.sessions[sessionID] = session
	sm.mu.Unlock()

	candidateMu.Lock()
	localCandidates = candidates
	candidateMu.Unlock()

	return answer.SDP, localCandidates, nil
}

// SendMessage sends a byte payload over the DataChannel for a given session.
func (sm *SessionManager) SendMessage(sessionID string, data []byte) error {
	sm.mu.RLock()
	session, ok := sm.sessions[sessionID]
	sm.mu.RUnlock()

	if !ok {
		return fmt.Errorf("session %s not found", sessionID)
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	if session.closed || session.DataChannel == nil {
		return fmt.Errorf("session %s DataChannel not available", sessionID)
	}

	return session.DataChannel.Send(data)
}

// CloseSession tears down a P2P session and its PeerConnection.
func (sm *SessionManager) CloseSession(sessionID string) {
	sm.mu.Lock()
	session, ok := sm.sessions[sessionID]
	if ok {
		delete(sm.sessions, sessionID)
	}
	sm.mu.Unlock()

	if !ok {
		return
	}

	session.mu.Lock()
	defer session.mu.Unlock()

	if session.closed {
		return
	}
	session.closed = true

	if session.PeerConnection != nil {
		session.PeerConnection.Close()
	}
}

// GetSession returns a session by ID, or nil if not found.
func (sm *SessionManager) GetSession(sessionID string) *Session {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return sm.sessions[sessionID]
}

// ActiveCount returns the number of active P2P sessions.
func (sm *SessionManager) ActiveCount() int {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return len(sm.sessions)
}
