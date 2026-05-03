import * as dc from 'node-datachannel';
import { sendSignalingOffer } from './signaling';

export interface P2PSession {
  dataChannel: dc.DataChannel;
  peerConnection: dc.PeerConnection;
  close: () => void;
}

export async function establishP2PConnection(gatewayUrl: string, key: string): Promise<P2PSession> {
  return new Promise((resolve, reject) => {
    let resolved = false;
    
    // We start with Google's STUN server just to gather our own reflexive IP.
    // The gateway will provide the full TURN credentials in the response.
    const pc = new dc.PeerConnection('RockOrBust-SDK', { 
      iceServers: ['stun:stun.l.google.com:19302'] 
    });

    const localCandidates: string[] = [];
    
    pc.onLocalCandidate((candidate, mid) => {
      localCandidates.push(JSON.stringify({
        candidate,
        sdpMid: mid,
        sdpMLineIndex: 0
      }));
    });

    const channel = pc.createDataChannel('proxy');

    pc.onLocalDescription((sdp, type) => {
      if (type === 'offer') {
        // Give it 500ms to gather local ICE candidates before signaling
        setTimeout(async () => {
          try {
            const answer = await sendSignalingOffer(gatewayUrl, key, {
              sdp,
              candidates: localCandidates
            });

            pc.setRemoteDescription(answer.sdp, 'answer');

            for (const candStr of answer.candidates) {
              try {
                const cand = JSON.parse(candStr);
                pc.addRemoteCandidate(cand.candidate, cand.sdpMid);
              } catch (e) {}
            }
          } catch (err) {
            if (!resolved) {
              resolved = true;
              pc.close();
              reject(err);
            }
          }
        }, 500);
      }
    });

    channel.onOpen(() => {
      if (!resolved) {
        resolved = true;
        resolve({
          dataChannel: channel,
          peerConnection: pc,
          close: () => {
            try { channel.close(); } catch(e) {}
            try { pc.close(); } catch(e) {}
          }
        });
      }
    });

    channel.onError((err) => {
      if (!resolved) {
        resolved = true;
        pc.close();
        reject(new Error(`DataChannel Error: ${err}`));
      }
    });

    // Timeout the whole connection process after 10s
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        pc.close();
        reject(new Error('P2P Connection Timeout'));
      }
    }, 10000);
  });
}
