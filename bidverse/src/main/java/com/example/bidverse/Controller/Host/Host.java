package com.example.bidverse.Controller.Host;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Repository.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.OffsetDateTime;
@RestController
@RequestMapping("/host")
public class Host {
    private final RoomRepository roomRepo;
    public Host(RoomRepository roomRepo) {
        this.roomRepo = roomRepo;
    }
    @PutMapping("/rooms/{roomId}/start")
    public ResponseEntity<?> startRoom(@PathVariable Long roomId) {
        Room room = roomRepo.findById(roomId);
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