const WS_URL = "wss://bkyz2-fmaaa-aaaaa-qaaaq-cai.ic0.app"; // Update with actual WebSocket Gateway URL

class WebSocketService {
    constructor() {
        this.socket = null;
        this.eventListeners = {};
    }

    connect() {
        this.socket = new WebSocket(WS_URL);

        this.socket.onopen = () => {
            console.log("WebSocket connected");
            this.triggerEvent("open");
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Received:", data);
            this.triggerEvent("message", data);
        };

        this.socket.onclose = () => {
            console.log("WebSocket disconnected");
            this.triggerEvent("close");
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    }

    sendMessage(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.error("WebSocket is not open");
        }
    }

    addEventListener(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    triggerEvent(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }
}

const websocketService = new WebSocketService();
export default websocketService;
