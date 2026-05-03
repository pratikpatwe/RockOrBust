import crypto from 'crypto';

interface PendingSession {
  resolve: (answer: { sdp: string; candidates: string[] }) => void;
  reject: (reason: Error) => void;
  timeout: NodeJS.Timeout;
}

class SignalingManager {
  private sessions = new Map<string, PendingSession>();

  /**
   * Creates a new pending signaling session and returns a promise that resolves
   * when the node responds via WebSocket.
   */
  public createSession(timeoutMs = 10000): { sessionId: string; promise: Promise<{ sdp: string; candidates: string[] }> } {
    const sessionId = crypto.randomUUID();
    
    let resolveFn!: (answer: { sdp: string; candidates: string[] }) => void;
    let rejectFn!: (reason: Error) => void;

    const promise = new Promise<{ sdp: string; candidates: string[] }>((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });

    const timeout = setTimeout(() => {
      this.sessions.delete(sessionId);
      rejectFn(new Error(`Signaling timeout for session ${sessionId}`));
    }, timeoutMs);

    this.sessions.set(sessionId, {
      resolve: resolveFn,
      reject: rejectFn,
      timeout,
    });

    return { sessionId, promise };
  }

  /**
   * Called by the WebSocket handler when a SIGNALING_ANSWER is received from a node.
   */
  public resolveSession(sessionId: string, sdp: string, candidates: string[]) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    clearTimeout(session.timeout);
    session.resolve({ sdp, candidates });
    this.sessions.delete(sessionId);
    return true;
  }
}

export const signalingManager = new SignalingManager();
