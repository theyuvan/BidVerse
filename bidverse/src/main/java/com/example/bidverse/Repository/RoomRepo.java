
package com.example.bidverse.Repository;
import com.example.bidverse.Entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoomRepo extends JpaRepository<Room, Long> {
    Optional<Room> findById(Long roomId);
}