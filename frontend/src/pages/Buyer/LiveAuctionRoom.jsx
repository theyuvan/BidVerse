import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { connectToAuction, sendBid } from "../../services/auctionSocket";
import { getRoomDetails, joinRoom } from "../../services/buyerService";
import { apiErrorMessage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { IconGavel } from "../../components/layout/icons";
import "./bidding-room.css";

export default function LiveAuctionRoom() {
    const { roomId } = useParams();
    const { session } = useAuth();
    const buyerId = session?.userId;
    const socketRef = useRef(null);

    const [products, setProducts] = useState([]);
    const [auction, setAuction] = useState(null);
    const [secondsRemaining, setSecondsRemaining] = useState(0);
    const [waitingSecondsRemaining, setWaitingSecondsRemaining] = useState(0);
    const [intermissionSeconds, setIntermissionSeconds] = useState(0);
    const [manualAmount, setManualAmount] = useState("");
    const [connected, setConnected] = useState(false);
    const [waitingForHost, setWaitingForHost] = useState(false);
    const [closedMessage, setClosedMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let stopped = false;
        let retryTimer;

        const handleUpdate = (update) => {
            if (stopped) return;

            setAuction(update);
            setSecondsRemaining(update.secondsRemaining ?? 0);
            setWaitingSecondsRemaining(update.waitingSecondsRemaining ?? 0);
            if (update.intermissionSecondsRemaining != null) {
                setIntermissionSeconds(update.intermissionSecondsRemaining);
            }

            if (update.auctionItemId) {
                setProducts((currentProducts) => currentProducts.map((product) => (
                    product.auctionItemId === update.auctionItemId
                        ? { ...product, currentPrice: update.currentPrice, auctionStatus: update.itemStatus }
                        : product
                )));
            }

            if (update.message) setNotice(update.message);
        };

        const openSocket = () => {
            socketRef.current = connectToAuction({
                roomId,
                buyerId,
                onUpdate: handleUpdate,
                onBidError: (bidError) => { if (!stopped) setError(bidError.message); },
                onConnectionChange: (isConnected) => { if (!stopped) setConnected(isConnected); },
                onConnectionError: (message) => { if (!stopped) setError(message); }
            });
        };

        const scheduleRoomCheck = () => { retryTimer = window.setTimeout(checkRoomStatus, 1500); };

        const checkRoomStatus = async () => {
            try {
                const response = await getRoomDetails(roomId);
                if (stopped) return;
                const status = response.data?.status?.toLowerCase();
                if (status === "waiting" || status === "live") {
                    await enterAuction();
                    return;
                }
                if (status === "completed" || status === "cancelled") {
                    setClosedMessage(status === "completed" ? "This auction has completed." : "This auction was cancelled.");
                    setWaitingForHost(false);
                    setLoading(false);
                    return;
                }
                setWaitingForHost(true);
                setLoading(false);
                scheduleRoomCheck();
            } catch (requestError) {
                if (stopped) return;
                setWaitingForHost(false);
                setError(apiErrorMessage(requestError, "Unable to check this auction room."));
                setLoading(false);
            }
        };

        const enterAuction = async () => {
            try {
                const response = await joinRoom(roomId);
                if (stopped) return;
                setProducts(response.data);
                setWaitingForHost(false);
                setError("");
                setLoading(false);
                openSocket();
            } catch (requestError) {
                if (stopped) return;
                if (requestError.response?.status === 410) {
                    setClosedMessage(apiErrorMessage(requestError, "This auction has ended."));
                    setWaitingForHost(false);
                    setLoading(false);
                    return;
                }
                if (requestError.response?.status === 400) {
                    setWaitingForHost(true);
                    setLoading(false);
                    scheduleRoomCheck();
                    return;
                }
                setError(apiErrorMessage(requestError, "Unable to enter this auction room."));
                setLoading(false);
            }
        };

        checkRoomStatus();

        return () => {
            stopped = true;
            window.clearTimeout(retryTimer);
            socketRef.current?.deactivate();
            socketRef.current = null;
        };
    }, [buyerId, roomId]);

    useEffect(() => {
        if (auction?.itemStatus !== "live") return undefined;
        const timer = window.setInterval(() => setSecondsRemaining((s) => Math.max(s - 1, 0)), 1000);
        return () => window.clearInterval(timer);
    }, [auction?.auctionItemId, auction?.itemStatus]);

    useEffect(() => {
        if (auction?.roomStatus !== "waiting") return undefined;
        const timer = window.setInterval(() => setWaitingSecondsRemaining((s) => Math.max(s - 1, 0)), 1000);
        return () => window.clearInterval(timer);
    }, [auction?.roomStatus]);

    const isIntermission = auction?.eventType === "ITEM_RESOLVED";
    useEffect(() => {
        if (!isIntermission) return undefined;
        const timer = window.setInterval(() => setIntermissionSeconds((s) => Math.max(s - 1, 0)), 1000);
        return () => window.clearInterval(timer);
    }, [isIntermission, auction?.auctionItemId]);

    const currentProduct = products.find((product) => product.auctionItemId === auction?.auctionItemId);
    const biddingIsOpen = connected && auction?.itemStatus === "live" && secondsRemaining > 0 && !isIntermission;

    const placeBid = (mode) => {
        setError("");
        setNotice("");
        const amount = Number(manualAmount);
        if (mode === "MANUAL" && (!manualAmount || Number.isNaN(amount))) {
            setError("Enter a valid bid amount.");
            return;
        }
        try {
            sendBid(socketRef.current, roomId, {
                auctionItemId: auction.auctionItemId,
                buyerId,
                mode,
                amount: mode === "MANUAL" ? amount : null
            });
            if (mode === "MANUAL") setManualAmount("");
        } catch (socketError) {
            setError(socketError.message);
        }
    };

    if (loading) return <p className="spinner-row">Entering auction room...</p>;

    if (error && products.length === 0 && !waitingForHost) {
        return (
            <div>
                <Link className="back-link" to="/buyer/rooms">← Back to rooms</Link>
                <p className="alert alert-error" role="alert">{error}</p>
            </div>
        );
    }

    if (closedMessage) {
        return (
            <div>
                <Link className="back-link" to="/buyer/rooms">← Back to rooms</Link>
                <div className="card bidding-finished">
                    <h2>Auction completed</h2>
                    <p>{closedMessage}</p>
                    <p>Anything you won is on the Deals page.</p>
                    <Link className="btn btn-primary" to="/buyer/deals" style={{ marginTop: 14 }}>View my deals</Link>
                </div>
            </div>
        );
    }

    if (waitingForHost) {
        return (
            <div>
                <Link className="back-link" to="/buyer/rooms">← Back to rooms</Link>
                <div className="card bidding-waiting">
                    <span className="pulse-dot" />
                    <h1>Waiting for the host</h1>
                    <p>Room #{roomId} will open here automatically once it starts.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bidding-room">
            <div className="bidding-topbar">
                <div>
                    <Link className="back-link" to="/buyer/rooms">← Back to rooms</Link>
                    <h1>Auction Room #{roomId}</h1>
                </div>
                <span className={`badge ${connected ? "badge-success" : "badge-warning"}`}>
                    {connected ? "Connected" : "Reconnecting..."}
                </span>
            </div>

            {auction?.roomStatus === "waiting" ? (
                <div className="card bidding-waiting">
                    <span className="pulse-dot" />
                    <h2>You're in the waiting room</h2>
                    <p>Bidding starts automatically when this timer reaches zero.</p>
                    <div className="countdown-ring">{waitingSecondsRemaining}</div>
                    <small>Keep this page open — your seat is confirmed.</small>
                </div>
            ) : auction?.roomStatus === "completed" ? (
                <div className="card bidding-finished">
                    <h2>Auction completed</h2>
                    <p>All products in this room have finished bidding.</p>
                    <Link className="btn btn-primary" to="/buyer/deals" style={{ marginTop: 14 }}>View my deals</Link>
                </div>
            ) : isIntermission ? (
                <div className="card result-banner" key={`${auction.auctionItemId}-${auction.itemStatus}`}>
                    <div className={`result-badge ${auction.itemStatus === "sold" ? "result-sold" : "result-unsold"}`}>
                        {auction.itemStatus === "sold" ? "🔥 SOLD" : "😕 UNSOLD"}
                    </div>
                    <h2>{auction.message}</h2>
                    <p className="result-sub">{auction.productName}</p>

                    {auction.nextProductName && (
                        <div className="up-next">
                            <span className="eyebrow">Up next</span>
                            <div className="up-next-card">
                                <div className="thumb">
                                    {auction.nextImageUrl
                                        ? <img src={auction.nextImageUrl} alt={auction.nextProductName} />
                                        : <span className="thumb-fallback"><IconGavel width={24} height={24} /></span>}
                                </div>
                                <div>
                                    <h3>{auction.nextProductName}</h3>
                                    <p>Bidding resumes in</p>
                                </div>
                                <div className="countdown-ring countdown-ring-sm">{intermissionSeconds}</div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <section className="card current-lot">
                    <div className="lot-heading">
                        <div>
                            <span className="eyebrow">Current product</span>
                            <h2>{auction?.productName || currentProduct?.productName || "Waiting for product"}</h2>
                        </div>
                        <div className={secondsRemaining <= 5 ? "countdown-ring countdown-urgent" : "countdown-ring"}>
                            {secondsRemaining}
                        </div>
                    </div>

                    <div className="thumb lot-image">
                        {currentProduct?.imageUrl
                            ? <img src={currentProduct.imageUrl} alt={currentProduct.productName} />
                            : <span className="thumb-fallback"><IconGavel width={36} height={36} /></span>}
                    </div>

                    <p className="lot-description">{currentProduct?.description || "The host will present the product during bidding."}</p>

                    <div className="bid-summary">
                        <div>
                            <span>Current bid</span>
                            <strong>₹{auction?.currentPrice ?? currentProduct?.currentPrice ?? "--"}</strong>
                        </div>
                        <div>
                            <span>Highest bidder</span>
                            <strong>
                                {auction?.highestBidderId
                                    ? auction.highestBidderId === buyerId ? "You" : `Buyer #${auction.highestBidderId}`
                                    : "No bids yet"}
                            </strong>
                        </div>
                    </div>

                    <div className="bid-actions">
                        <button className="btn btn-primary" type="button" disabled={!biddingIsOpen} onClick={() => placeBid("AUTO")}>
                            Quick bid +5%
                        </button>
                        <div className="manual-bid">
                            <input
                                type="number" min="0" step="0.01"
                                value={manualAmount}
                                onChange={(event) => setManualAmount(event.target.value)}
                                disabled={!biddingIsOpen}
                                placeholder="Enter amount"
                            />
                            <button className="btn btn-ghost" type="button" disabled={!biddingIsOpen} onClick={() => placeBid("MANUAL")}>
                                Place bid
                            </button>
                        </div>
                    </div>

                    {notice && <p className="alert alert-success" role="status">{notice}</p>}
                    {error && <p className="alert alert-error" role="alert">{error}</p>}
                </section>
            )}

            <div className="section-block">
                <div className="section-block-head">
                    <h2>Products in this auction</h2>
                    <span>{products.length} products</span>
                </div>
                <div className="lot-list">
                    {products.map((product) => (
                        <article key={product.auctionItemId} className={`lot-list-item${product.auctionItemId === auction?.auctionItemId ? " active" : ""}`}>
                            <div className="thumb">
                                {product.imageUrl
                                    ? <img src={product.imageUrl} alt={product.productName} />
                                    : <span className="thumb-fallback"><IconGavel width={18} height={18} /></span>}
                            </div>
                            <h3>{product.productName}</h3>
                            <span className={`badge badge-${product.auctionStatus === "sold" ? "success" : product.auctionStatus === "live" ? "danger" : "neutral"}`}>
                                {product.auctionStatus}
                            </span>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
