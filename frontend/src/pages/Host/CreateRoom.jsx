import { useState } from "react";
import { createRoom } from "../../services/hostService";
import "./CreateRoom.css";

function CreateRoom() {
    const [formData, setFormData] = useState({
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
                hostId: 1,
                title: formData.title,
                seatLimit: Number(formData.seatLimit),
                advanceAmount: Number(formData.advanceAmount),
                status: "upcoming",
                startTime: `${formData.startTime}:00+05:30`,
            });

            setMessage("Room created successfully.");

            setFormData({
                title: "",
                seatLimit: "",
                advanceAmount: "",
                startTime: "",
            });
        } catch (requestError) {
            const responseData = requestError.response?.data;

            setError(
                typeof responseData === "string"
                    ? responseData
                    : responseData?.message || "Unable to create room."
            );
        }
    };

    return (
        <main className="host-page create-room-page">
            <header className="page-header">
                <h1>Create Auction Room</h1>
            </header>

            <form className="create-room-form" onSubmit={handleSubmit}>
                <div className="room-fields">

                    <div className="room-field-card">
                        <label>
                            <span>Room Title</span>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Enter room title" required />
                        </label>
                    </div>

                    <div className="room-field-card">
                        <label>
                            <span>Seat Limit</span>
                            <input type="number" name="seatLimit" value={formData.seatLimit} onChange={handleChange} placeholder="Enter maximum seats" required />
                        </label>
                    </div>

                    <div className="room-field-card">
                        <label>
                            <span>Advance Amount</span>
                            <input type="number" name="advanceAmount" value={formData.advanceAmount} onChange={handleChange} placeholder="Enter advance amount" required />
                        </label>
                    </div>

                    <div className="room-field-card">
                        <label>
                            <span>Start Time</span>
                            <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} required />
                        </label>
                    </div>

                </div>

                <div className="create-room-auction">
                    <button type="submit">Create Room</button>
                </div>

                {message && <p className="form-success" role="status">{message}</p>}
                {error && <p className="form-error" role="alert">{error}</p>}
            </form>
        </main>
    );
}

export default CreateRoom;