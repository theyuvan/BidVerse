import axios from "axios";
 
export const getRooms=()=>{
    return axios.get("http://localhost:8080/rooms")
};