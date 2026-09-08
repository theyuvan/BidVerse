import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { connectToAuction, sendBid } from "../../services/auctionSocket";
import { getBuyerId } from "../../services/buyerSession";
import { getRoomDetails, joinRoom } from "../../services/buyerService";
import "./LiveAuctionRoom.css";

function requestErrorMessage(error, fallback) {
    const data = error.response?.data;
    return typeof data === "string" ? data : data?.detail || data?.message || fallback;
}

function LiveAuctionRoom() {
    const { roomId } = useParams();
    const buyerId = getBuyerId();
    const socketRef = useRef(null);

    const [products, setProducts] = useState([]);
    const [auction, setAuction] = useState(null);
    const [secondsRemaining, setSecondsRemaining] = useState(0);
    const [waitingSecondsRemaining, setWaitingSecondsRemaining] = useState(0);
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

            if (update.auctionItemId) {
                setProducts((currentProducts) => currentProducts.map((product) => (
                    product.auctionItemId === update.auctionItemId
                        ? {
                            ...product,
                            currentPrice: update.currentPrice,
                            auctionStatus: update.itemStatus
                        }
                        : product
                )));
            }

            if (update.message) setNotice(update.message);
        };

        const openSocket = () => {
            const socket = connectToAuction({
                roomId,
                buyerId,
                onUpdate: handleUpdate,
                onBidError: (bidError) => {
                    if (!stopped) setError(bidError.message);
                },
                onConnectionChange: (isConnected) => {
                    if (!stopped) setConnected(isConnected);
                },
                onConnectionError: (message) => {
                    if (!stopped) setError(message);
                }
            });

            socketRef.current = socket;
        };

        const scheduleRoomCheck = () => {
            retryTimer = window.setTimeout(checkRoomStatus, 1500);
        };

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
                    setClosedMessage(status === "completed"
                        ? "This auction has completed."
                        : "This auction was cancelled.");
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
                setError(requestErrorMessage(requestError, "Unable to check this auction room."));
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
                    setClosedMessage(requestErrorMessage(requestError, "This auction has ended."));
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

                setError(requestErrorMessage(requestError, "Unable to enter this auction room."));
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

        const timer = window.setInterval(() => {
            setSecondsRemaining((seconds) => Math.max(seconds - 1, 0));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [auction?.auctionItemId, auction?.itemStatus]);

    useEffect(() => {
        if (auction?.roomStatus !== "waiting") return undefined;

        const timer = window.setInterval(() => {
            setWaitingSecondsRemaining((seconds) => Math.max(seconds - 1, 0));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [auction?.roomStatus]);

    const currentProduct = products.find(
        (product) => product.auctionItemId === auction?.auctionItemId
    );
    const biddingIsOpen = connected
        && auction?.itemStatus === "live"
        && secondsRemaining > 0;

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

    if (loading) {
        return <main className="live-auction-page"><p>Entering auction room...</p></main>;
    }

    if (error && products.length === 0 && !waitingForHost) {
        return (
            <main className="live-auction-page">
                <Link className="back-link" to="/buyer">Back to buyer rooms</Link>
                <p className="auction-error" role="alert">{error}</p>
            </main>
        );
    }

    if (closedMessage) {
        return (
            <main className="live-auction-page">
                <Link className="back-link" to="/buyer">Back to buyer rooms</Link>
                <section className="auction-finished">
                    <h2>Auction completed</h2>
                    <p>{closedMessage}</p>
                    <p>Your winning products and seller contact details are available on the buyer dashboard.</p>
                </section>
            </main>
        );
    }

    if (waitingForHost) {
        return (
            <main className="live-auction-page waiting-room">
                <Link className="back-link" to="/buyer">Back to buyer rooms</Link>
                <div className="waiting-card">
                    <span className="waiting-dot" />
                    <h1>Waiting for the host</h1>
                    <p>Room #{roomId} will open here automatically when the host starts it.</p>
                    <small>You are joining as buyer #{buyerId}.</small>
                </div>
            </main>
        );
    }

    return (
        <main className="live-auction-page">
            <div className="auction-topbar">
                <div>
                    <Link className="back-link" to="/buyer">Back to buyer rooms</Link>
                    <h1>Auction Room #{roomId}</h1>
                    <p>Buyer #{buyerId}</p>
                </div>
                <span className={connected ? "connection online" : "connection offline"}>
                    {connected ? "Connected" : "Reconnecting"}
                </span>
            </div>

            {auction?.roomStatus === "waiting" ? (
                <section className="waiting-card entered-waiting-room">
                    <span className="waiting-dot" />
                    <h2>You are in the waiting room</h2>
                    <p>The auction will start automatically when this timer reaches zero.</p>
                    <div className="waiting-countdown">{waitingSecondsRemaining}</div>
                    <small>Keep this page open. Your attendance has been recorded.</small>
                </section>
            ) : auction?.roomStatus === "completed" ? (
                <section className="auction-finished">
                    <h2>Auction completed</h2>
                    <p>All products in this room have finished bidding.</p>
                </section>
            ) : (
                <section className="current-lot">
                    <div className="lot-heading">
                        <div>
                            <span className="eyebrow">Current product</span>
                            <h2>{auction?.productName || currentProduct?.productName || "Waiting for product"}</h2>
                        </div>
                        <div className={secondsRemaining <= 3 ? "auction-timer urgent" : "auction-timer"}>
                            <strong>{secondsRemaining}</strong>
                            <span>seconds</span>
                        </div>
                    </div>

                    {currentProduct?.imageUrl && (
                        <img
                            className="current-product-image"
                            src={currentProduct.imageUrl}
                            alt={currentProduct.productName}
                        />
                    )}

                    <p className="lot-description">
                        {currentProduct?.description || "The host will present the product during bidding."}
                    </p>

                    <div className="bid-summary">
                        <div>
                            <span>Current bid</span>
                            <strong>₹{auction?.currentPrice ?? currentProduct?.currentPrice ?? "--"}</strong>
                        </div>
                        <div>
                            <span>Highest bidder</span>
                            <strong>
                                {auction?.highestBidderId
                                    ? auction.highestBidderId === buyerId
                                        ? "You"
                                        : `Buyer #${auction.highestBidderId}`
                                    : "No bids yet"}
                            </strong>
                        </div>
                    </div>

                    <div className="bid-actions">
                        <button
                            className="quick-bid"
                            type="button"
                            disabled={!biddingIsOpen}
                            onClick={() => placeBid("AUTO")}
                        >
                            Quick bid +5%
                        </button>

                        <div className="manual-bid">
                            <label htmlFor="manual-amount">Your amount</label>
                            <div>
                                <input
                                    id="manual-amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={manualAmount}
                                    onChange={(event) => setManualAmount(event.target.value)}
                                    disabled={!biddingIsOpen}
                                    placeholder="Enter amount"
                                />
                                <button
                                    type="button"
                                    disabled={!biddingIsOpen}
                                    onClick={() => placeBid("MANUAL")}
                                >
                                    Place bid
                                </button>
                            </div>
                        </div>
                    </div>

                    {notice && <p className="auction-notice" role="status">{notice}</p>}
                    {error && <p className="auction-error" role="alert">{error}</p>}
                </section>
            )}

            <section className="auction-products">
                <h2>Products in this auction</h2>
                <div className="auction-product-list">
                    {products.map((product) => (
                        <article
                            key={product.auctionItemId}
                            className={product.auctionItemId === auction?.auctionItemId ? "active" : ""}
                        >
                            {product.imageUrl && (
                                <img src={product.imageUrl} alt="" />
                            )}
                            <div>
                                <span>Lot {product.auctionItemId}</span>
                                <h3>{product.productName}</h3>
                            </div>
                            <strong>{product.auctionStatus}</strong>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}

export default LiveAuctionRoom;
