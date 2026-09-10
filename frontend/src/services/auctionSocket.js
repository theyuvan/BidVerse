import { Client } from "@stomp/stompjs";
import { getAuthorizationHeader } from "./authSession";
import { auctionSocketUrl } from "./backendUrl";

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
        brokerURL: auctionSocketUrl,
        connectHeaders: {
            Authorization: getAuthorizationHeader() || ""
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

export function sendNext(client, roomId, auctionItemId) {
    if (!client?.connected) throw new Error("Reconnect to the auction before continuing.");
    client.publish({
        destination: `/app/room/${roomId}/next`,
        body: JSON.stringify({ auctionItemId })
    });
}

export function watchRoomCatalogue() {
    const client = new Client({
        brokerURL: auctionSocketUrl,
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        beforeConnect: () => {
            const authorization = getAuthorizationHeader();
            if (!authorization) { client.deactivate(); return; }
            client.connectHeaders = { Authorization: authorization };
        },
        onConnect: () => {
            client.subscribe("/topic/rooms", () => window.dispatchEvent(new Event("bidverse:rooms-changed")));
            window.dispatchEvent(new Event("bidverse:rooms-changed"));
        }
    });
    client.activate();
    return () => { client.deactivate(); };
}
