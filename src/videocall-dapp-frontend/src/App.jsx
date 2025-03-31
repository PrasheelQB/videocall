import React, { useEffect, useState } from "react";
import websocketService from "./services/websocketService";
import "./index.scss";

function App() {
    const [calleePrincipal, setCalleePrincipal] = useState("");
    const [status, setStatus] = useState("Disconnected");

    useEffect(() => {
        websocketService.connect();
        websocketService.initializeRTC();

        websocketService.addEventListener("open", () => setStatus("Connected"));
        websocketService.addEventListener("close", () => setStatus("Disconnected"));

        return () => {
            if (websocketService.socket) {
                websocketService.socket.close();
            }
        };
    }, []);

    const startCall = async () => {
        try {
            await websocketService.addLocalStream();
            const offer = await websocketService.createOffer();
            websocketService.peerPrincipal = calleePrincipal;
            websocketService.sendMessage({
                kind: "offer",
                to: calleePrincipal,
                data: JSON.stringify(offer)
            });
            setStatus("Calling...");
        } catch (error) {
            console.error("Failed to start call:", error);
            setStatus("Error: " + error.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
            <h1 className="text-2xl font-bold mb-4">Video Call Dapp</h1>
            <div className="flex space-x-4">
                <video id="localVideo" autoPlay muted className="w-48 h-36 bg-black rounded"></video>
                <video id="remoteVideo" autoPlay className="w-48 h-36 bg-black rounded"></video>
            </div>
            <input
                type="text"
                placeholder="Enter callee Principal (e.g., bkyz2-fmaaa-aaaaa-qaaaq-cai)"
                className="p-2 mt-4 text-black rounded w-80"
                value={calleePrincipal}
                onChange={(e) => setCalleePrincipal(e.target.value)}
            />
            <button
                onClick={startCall}
                className="mt-4 bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
            >
                Start Call
            </button>
            <p className="mt-2">{status}</p>
        </div>
    );
}

export default App;