import React, { useEffect, useState } from "react";
import websocketService from "./services/websocketService";
import "./index.scss";

function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        websocketService.connect();

        websocketService.addEventListener("message", (data) => {
            setMessages((prev) => [...prev, data]);
        });

        return () => {
            console.log("Component unmounting, closing WebSocket");
        };
    }, []);

    const sendMessage = () => {
        if (input.trim()) {
            const message = { kind: "chat", data: input };
            websocketService.sendMessage(message);
            setInput("");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
            <h1 className="text-2xl font-bold mb-4">WebSocket Chat</h1>
            <div className="border border-gray-500 p-4 w-96 h-64 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className="p-2 border-b border-gray-700">
                        {JSON.stringify(msg)}
                    </div>
                ))}
            </div>
            <div className="mt-4 flex">
                <input
                    type="text"
                    className="p-2 text-black rounded-l-md"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button
                    onClick={sendMessage}
                    className="bg-blue-500 px-4 py-2 rounded-r-md"
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default App;
