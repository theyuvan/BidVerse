import {useState} from "react";
function MyRooms(){
    const[rooms,setRooms] = useState([]);

    return (
        <main>
            <header>
                <h1> MyRooms</h1>
                <p>View and manage rooms</p>
            </header>

            <section>
                <h2> Auction room</h2>
                {rooms.length ===0?(
                    <p>No rooms available.</p>
                ):(
                    rooms.map((room) =>(
                        <article key={room.id}>
                            <h3>{room.title}</h3>
                            <p>Status: {room.status}</p>
                            <p>Seats: {room.seats}</p>
                            <p>Advance: {room.advance}</p>
                        </article>
                    ))
                )}
            </section>
        </main>
    );
}
export default MyRooms;