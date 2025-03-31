const WS_URL = "ws://127.0.0.1:8080/ws/bkyz2-fmaaa-aaaaa-qaaaq-cai"; // Local gateway URL for now

class WebSocketService {
    constructor() {
        this.socket = null;
        this.eventListeners = {};
        this.rtcPeerConnection = null;
        this.peerPrincipal = null; // Store the target user's Principal
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
            this.handleSignalingMessage(data); // Process WebRTC signaling
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

    initializeRTC() {
        this.rtcPeerConnection = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }] // Free STUN server for NAT traversal
        });

        this.rtcPeerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendMessage({
                    kind: "ice",
                    to: this.peerPrincipal,
                    data: JSON.stringify(event.candidate)
                });
            }
        };

        this.rtcPeerConnection.ontrack = (event) => {
            const remoteVideo = document.getElementById("remoteVideo");
            if (remoteVideo) {
                remoteVideo.srcObject = event.streams[0];
            }
        };
    }

    async addLocalStream() {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const localVideo = document.getElementById("localVideo");
        if (localVideo) {
            localVideo.srcObject = stream;
        }
        stream.getTracks().forEach(track => this.rtcPeerConnection.addTrack(track, stream));
    }

    async createOffer() {
        const offer = await this.rtcPeerConnection.createOffer();
        await this.rtcPeerConnection.setLocalDescription(offer);
        return offer;
    }

    async createAnswer(offer) {
        await this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.rtcPeerConnection.createAnswer();
        await this.rtcPeerConnection.setLocalDescription(answer);
        return answer;
    }

    async handleSignalingMessage(data) {
        if (data.kind === "offer") {
            await this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.data)));
            const answer = await this.createAnswer();
            this.sendMessage({
                kind: "answer",
                to: data.from || data.to, // Use "from" if backend adds it, else "to"
                data: JSON.stringify(answer)
            });
        } else if (data.kind === "answer") {
            await this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.data)));
        } else if (data.kind === "ice") {
            await this.rtcPeerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(data.data)));
        }
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

export default new WebSocketService();