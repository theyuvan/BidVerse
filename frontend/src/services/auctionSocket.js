import { Client } from "@stomp/stompjs";
import { getAuthHeader } from "./session";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const socketUrl = `${apiBaseUrl.replace(/^http/, "ws").replace(/\/$/, "")}/ws`;

function readMessage(message, callback) {
    try {
        callback(JSON.parse(message.body));
    } catch {
        callback({ message: "The server sent an invalid auction update." });
    }
}

export function connectToAuction({
    roomId,
    buyerId,
    onUpdate,
    onBidError,
    onConnectionChange,
    onConnectionError
}) {
    const client = new Client({
        brokerURL: socketUrl,
        connectHeaders: {
            Authorization: getAuthHeader() || ""
        },
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000
    });

    client.onConnect = () => {
        onConnectionChange(true);

        client.subscribe(`/topic/room/${roomId}`, (message) => {
            readMessage(message, onUpdate);
        });

        client.subscribe(`/topic/room/${roomId}/buyer/${buyerId}`, (message) => {
            readMessage(message, onBidError);
        });

        client.subscribe(`/app/room/${roomId}/status`, (message) => {
            readMessage(message, onUpdate);
        });
    };

    client.onWebSocketClose = () => onConnectionChange(false);
    client.onWebSocketError = () => onConnectionError("Unable to connect to the auction.");
    client.onStompError = (frame) => {
        onConnectionError(frame.headers.message || "The auction connection failed.");
    };

    client.activate();
    return client;
}

export function sendBid(client, roomId, bid) {
    if (!client?.connected) {
        throw new Error("The auction is not connected yet.");
    }

    client.publish({
        destination: `/app/room/${roomId}/bid`,
        body: JSON.stringify(bid)
    });
}
