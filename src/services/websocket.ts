type MessageHandler = (data: any) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private urls: string[];
  private urlIndex = 0;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private isConnected = false;
  private heartbeatInterval: number | null = null;
  private shouldReconnect = true;

  constructor(urls: string | string[]) {
    this.urls = typeof urls === 'string' ? [urls] : urls;
  }

  connect(onStatusChange?: (connected: boolean) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.shouldReconnect = true;
        const url = this.urls[this.urlIndex];
        console.log(`[WS] Connecting to ${url}`);
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[WS] Connected to ARGUS server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          onStatusChange?.(true);
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log('[WS] Disconnected', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();
          onStatusChange?.(false);
          if (this.shouldReconnect) {
            this.urlIndex = (this.urlIndex + 1) % this.urls.length;
            console.log(`[WS] Falling back to ${this.urls[this.urlIndex]}`);
            this.attemptReconnect(onStatusChange);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Error', error);
          if (!this.isConnected) {
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('[WS] Failed to parse message', e);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  private attemptReconnect(onStatusChange?: (connected: boolean) => void): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 15000);

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (!this.isConnected) {
        this.connect(onStatusChange);
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleMessage(data: any): void {
    const { type, payload } = data;

    if (type && this.handlers.has(type)) {
      this.handlers.get(type)?.forEach(handler => handler(payload));
    }

    // Wildcard listeners get the full message
    this.handlers.get('*')?.forEach(handler => handler(data));
  }

  on(eventType: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  send(type: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('[WS] Cannot send — not connected');
    }
  }

  subscribe(channelId: string): void {
    this.send('subscribe', { channel_id: channelId });
  }

  unsubscribe(channelId: string): void {
    this.send('unsubscribe', { channel_id: channelId });
  }

  isConnecting(): boolean {
    return this.ws?.readyState === WebSocket.CONNECTING;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
// Server WebSocket is at /stream (streaming.py mounts @router.websocket("/stream"))
export const wsService = new WebSocketService([
  'wss://argus-server-970096522851.asia-south1.run.app/stream',
  'ws://127.0.0.1:8000/stream',
]);
