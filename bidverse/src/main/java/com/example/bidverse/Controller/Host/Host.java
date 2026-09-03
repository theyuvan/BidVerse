package com.example.bidverse.Controller.Host;

import com.example.bidverse.Entity.Room;
import com.example.bidverse.Repository.CreateRoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/host")
public class Host {

    private final CreateRoomRepository roomRepo;

    public Host(CreateRoomRepository roomRepo) {
        this.roomRepo = roomRepo;
    }

    // Start a room
    @PutMapping("/rooms/{roomId}/start")
    public ResponseEntity<?> startRoom(@PathVariable Long roomId) {

        Room room = roomRepo.findById(roomId).orElse(null);

        if (room == null) {
            return new ResponseEntity<>(
                    "Room Not Found",
                    HttpStatus.NOT_FOUND
            );
        }

        room.setStatus("LIVE");
        room.setStartTime(OffsetDateTime.now());

        roomRepo.save(room);

        return new ResponseEntity<>(
                "Room Started Successfully",
                HttpStatus.OK
        );
    }
}