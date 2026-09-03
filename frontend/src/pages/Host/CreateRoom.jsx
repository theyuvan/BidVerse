import { useState } from "react";
import { createRoom } from "../../services/hostService";

function CreateRoom(){
    const [formData, setFormData] = useState({
        hostId: "",
        title: "",
        seatLimit: "",
        advanceAmount: "",
        startTime: "",
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");

        try {
            await createRoom({
                hostId: Number(formData.hostId),
                title: formData.title,
                seatLimit: Number(formData.seatLimit),
                advanceAmount: Number(formData.advanceAmount),
                status: "upcoming",
                startTime: `${formData.startTime}:00Z`,
            });
            setMessage("Room created successfully.");
            setFormData({
                hostId: "",
                title: "",
                seatLimit: "",
                advanceAmount: "",
                startTime: "",
            });
        } catch (requestError) {
            const responseData = requestError.response?.data;
            setError(typeof responseData === "string"
                ? responseData
                : responseData?.message || "Unable to create room.");
        }
    };

    return(
        <main className="host-page create-room-page">
            <header className="page-header">
                <h1>Create Auction Room</h1>
                <p>Set the details for your next auction.</p>
            </header>
            <form className="room-form" onSubmit={handleSubmit}>
                <label>
                    <span>Host ID</span>
                    <input type="number" name="hostId" value={formData.hostId} onChange={handleChange} required />
                </label>
                <label>
                    <span>Room Title</span>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                </label>
                <label> 
                    <span>Seat Limit</span>
                    <input type="number" name="seatLimit" value={formData.seatLimit} onChange={handleChange} required />
                </label>
                <label>
                    <span>Advance Amount</span>
                    <input type="number" name="advanceAmount" value={formData.advanceAmount} onChange={handleChange} required />
                </label>
                <label>
                    <span>Start time</span>
                    <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} required />
                </label>
                <button type="submit">Create Room</button>
                {message && <p role="status">{message}</p>}
                {error && <p role="alert">{error}</p>}
            </form>
        </main>
    );
}
export default CreateRoom;