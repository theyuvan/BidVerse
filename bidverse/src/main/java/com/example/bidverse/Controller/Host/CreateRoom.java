package com.example.bidverse.Controller.Host;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Repository.CreateRoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/host")
public class CreateRoom {
    private final CreateRoomRepository roomRepo;
    public CreateRoom(CreateRoomRepository roomRepo) {
        this.roomRepo = roomRepo;
    }  
    @GetMapping("/rooms")
    public ResponseEntity<?> getAllRooms() {
        return new ResponseEntity<>(roomRepo.findAll(), HttpStatus.OK);
    } 
    @PostMapping("/rooms")
    public ResponseEntity<?> createRoom(@RequestBody Room room) {
        roomRepo.save(room);
        return new ResponseEntity<>(
                "Room Created Successfully",
                HttpStatus.CREATED
        );
    }
}