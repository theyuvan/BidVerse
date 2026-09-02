package com.example.bidverse.Repository;
import com.example.bidverse.Entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreateRoomRepository
        extends JpaRepository<Room, Long> {
}