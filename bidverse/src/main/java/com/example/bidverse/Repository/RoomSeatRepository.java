package com.example.bidverse.Repository;

import com.example.bidverse.Entity.Room_Seat;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomSeatRepository extends JpaRepository<Room_Seat, Long> {
    long countByRoomId(Long roomId);
    boolean existsByRoomIdAndBuyerId(Long roomId, Long buyerId);
}
