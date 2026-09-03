package com.example.bidverse.Repository;

import com.example.bidverse.Entity.Room_Seat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomSeatRepository extends JpaRepository<Room_Seat, Long> {
    long countByRoomId(Long roomId);
    boolean existsByRoomIdAndBuyerId(Long roomId, Long buyerId);

    List<Room_Seat> findByBuyerId(Long buyerId);
}
