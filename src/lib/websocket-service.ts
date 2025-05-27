import EventEmitter from "eventemitter3";

class WebSocketService {
  private wsUrl: string;
  private socket: WebSocket | null = null;
  private transactionSocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectDelay = 2500;
  private reconnectDelayMax = 4500;
  private randomizationFactor = 0.5;
  private emitter = new EventEmitter();
  private subscribedRooms = new Set<string>();
  private transactions = new Set<string>();

  constructor(wsUrl: string) {
    this.wsUrl = wsUrl;
    this.connect();

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.disconnect.bind(this));
    }
  }

  async connect() {
    if (this.socket && this.transactionSocket) {
      return;
    }

    try {
      this.socket = new WebSocket(this.wsUrl);
      this.transactionSocket = new WebSocket(this.wsUrl);
      this.setupSocketListeners(this.socket, "main");
      this.setupSocketListeners(this.transactionSocket, "transaction");
    } catch (e) {
      console.error("Error connecting to WebSocket:", e);
      this.reconnect();
    }
  }

  setupSocketListeners(socket: WebSocket, type: string) {
    socket.onopen = () => {
      console.log(`Connected to ${type} WebSocket server`);
      this.reconnectAttempts = 0;
      this.resubscribeToRooms();
    };

    socket.onclose = () => {
      console.log(`Disconnected from ${type} WebSocket server`);
      if (type === "main") this.socket = null;
      if (type === "transaction") this.transactionSocket = null;
      this.reconnect();
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "message") {
          if (message.data?.tx && this.transactions.has(message.data.tx)) {
            return;
          } else if (message.data?.tx) {
            this.transactions.add(message.data.tx);
          }
          if (message.room.includes('price:')) {
            this.emitter.emit(`price-by-token:${message.data.token}`, message.data);
          }
          this.emitter.emit(message.room, message.data);
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.transactionSocket) {
      this.transactionSocket.close();
      this.transactionSocket = null;
    }
    this.subscribedRooms.clear();
    this.transactions.clear();
  }

  reconnect() {
    console.log("Reconnecting to WebSocket server");
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.reconnectDelayMax
    );
    const jitter = delay * this.randomizationFactor;
    const reconnectDelay = delay + Math.random() * jitter;

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, reconnectDelay);
  }

  resubscribeToRooms() {
    this.subscribedRooms.forEach(room => {
      const socket = room.includes("transaction")
        ? this.transactionSocket
        : this.socket;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "join", room }));
      }
    });
  }

  joinRoom(room: string) {
    this.subscribedRooms.add(room);
    const socket = room.includes("transaction")
      ? this.transactionSocket
      : this.socket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "join", room }));
    }
  }

  leaveRoom(room: string) {
    this.subscribedRooms.delete(room);
    const socket = room.includes("transaction")
      ? this.transactionSocket
      : this.socket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "leave", room }));
    }
  }

  on(event: string, callback: (data: any) => void) {
    this.emitter.on(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.emitter.off(event, callback);
  }

  once(event: string, callback: (data: any) => void) {
    this.emitter.once(event, callback);
  }
}

// Create singleton instance
let wsInstance: WebSocketService | null = null;

export const getWebSocketService = () => {
  if (!wsInstance) {
    // We'll need to get the actual WebSocket URL from Solana Tracker
    // For now, using a placeholder that will need to be configured
    wsInstance = new WebSocketService("wss://websocket.solanatracker.io");
  }
  return wsInstance;
};

export default WebSocketService;