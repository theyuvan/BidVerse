import { Link } from "react-router-dom";

export default function HostRoomCard({ room }) {
    const status = room.status?.toLowerCase() || "upcoming";
    return <article className="host-room-tile">
        <div className="host-room-top"><span className={`host-status ${status}`}>{status}</span><span>Room #{room.roomId}</span></div>
        <div className="host-room-symbol" aria-hidden="true">B<span>LIVE AUCTIONS</span></div>
        <Link className="host-room-title" to={`/host/rooms/${room.roomId}`}><h3 title={room.title}>{room.title}</h3></Link>
        <dl className="host-room-facts"><div><dt>Seats</dt><dd>{room.seatLimit}</dd></div><div><dt>Advance</dt><dd>₹{Number(room.advanceAmount).toLocaleString("en-IN")}</dd></div></dl>
        <div className="host-room-date"><span>Scheduled automatic start</span><strong>{room.startTime ? new Date(room.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Not scheduled"}</strong></div>
        <div className="host-room-actions"><Link className="button-primary" to={`/host/rooms/${room.roomId}`}>Manage room →</Link>
        </div>
    </article>;
}
