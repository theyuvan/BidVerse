package com.example.bidverse.Repository;

import com.example.bidverse.Entity.Room_Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface RoomSeatRepository extends JpaRepository<Room_Seat, Long> {
    long countByRoomId(Long roomId);
    @Query("select s.buyerId from Room_Seat s where s.roomId = :roomId and s.attendanceStatus = 'joined'")
    List<Long> findJoinedBuyerIds(@Param("roomId") Long roomId);
    boolean existsByRoomIdAndBuyerId(Long roomId, Long buyerId);
    boolean existsByRoomIdAndBuyerIdAndAttendanceStatus(Long roomId, Long buyerId, String attendanceStatus);

    List<Room_Seat> findByBuyerId(Long buyerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Room_Seat s SET s.joinedAt = :joinedAt, s.attendanceStatus = 'joined' " +
            "WHERE s.roomId = :roomId AND s.buyerId = :buyerId")
    int markBuyerJoined(@Param("roomId") Long roomId,
                        @Param("buyerId") Long buyerId,
                        @Param("joinedAt") OffsetDateTime joinedAt);
}
