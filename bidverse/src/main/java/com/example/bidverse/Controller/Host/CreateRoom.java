package com.example.bidverse.Controller.Host;

import com.example.bidverse.Entity.Room;
import com.example.bidverse.Repository.CreateRoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/host")
public class CreateRoom {

    private final CreateRoomRepository roomRepo;

    public CreateRoom(CreateRoomRepository roomRepo) {
        this.roomRepo = roomRepo;
    }

    // GET all rooms
    @GetMapping("/rooms")
    public ResponseEntity<?> getAllRooms() {

        return new ResponseEntity<>(
                roomRepo.findAll(),
                HttpStatus.OK
        );
    }

    // CREATE a room
    @PostMapping("/rooms")
    public ResponseEntity<?> createRoom(@RequestBody Room room) {

        roomRepo.save(room);

        return new ResponseEntity<>(
                "Room Created Successfully",
                HttpStatus.CREATED
        );
    }
}