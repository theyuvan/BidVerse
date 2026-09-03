function CreateRoom(){
    return(
        <main>
            <header>
                <h1>Create Auction Room</h1>
            </header>
            <form>
                <label>
                    Room Title
                    <input type="text" name="title" />
                </label>
                <label> 
                    Seat Limit
                    <input type="number" name="seats" />
                </label>
                <label>
                    Advance Amount
                    <input type="number" name="advance" />
                </label>
                <lable>
                    Start time
                    <input type="datetime-local" />
                </lable>
                <button type="submit">Create Room</button>
            </form>
        </main>
    );
}
export default CreateRoom;