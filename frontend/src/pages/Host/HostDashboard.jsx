import { useEffect , useState} from "react";
import {getRooms} from "../../services/hostService";
function HostDashboard(){
    const[rooms,setRooms] = useState([]);

    useEffect(() => {
        getRooms().then((response) => {
            setRooms(response.data);
        });
    },[]);

    return(
        <main>     
            <header> 
                <h1>Host Dashboard</h1>
            </header>
            <section>
                <h2>My Rooms</h2>
                {rooms.map((room) =>(
                    <article key={room.id}>
                        <h3>{room.title}</h3>
                        <p>Status: {room.status}</p>
                        <p>Seats: {room.seats}</p>
                        <p>Advance: {room.advance}</p>
                    </article>
                ))}
            </section>
            <section>
                <h2>Products</h2>
                <p>Verify Seller products and assign them to rooms.</p>
            </section>
            <p>Welcome to the Host Dashboard! Here you can manage your auctions and view your bids.</p>
        </main>
    );
}
export default HostDashboard;