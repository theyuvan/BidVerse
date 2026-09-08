
package com.example.bidverse.Repository;
import com.example.bidverse.Entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface RoomRepo extends JpaRepository<Room, Long> {

    List<Room> findByStatusNotIn(List<String> statuses);

    List<Room> findByStatus(String status);

    List<Room> findByStatusInAndStartTimeLessThanEqual(List<String> statuses, OffsetDateTime startTime);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Room r SET r.status = 'waiting', r.waitingStartedAt = :startedAt " +
            "WHERE r.roomId = :id AND r.status IN ('upcoming', 'open')")
    int beginWaitingIfNotStarted(@Param("id") Long id, @Param("startedAt") OffsetDateTime startedAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Room r SET r.status = 'live', r.liveStartedAt = :liveAt " +
            "WHERE r.roomId = :id AND r.status = 'waiting' AND r.waitingStartedAt <= :cutoff")
    int goLiveIfWaiting(@Param("id") Long id,
                        @Param("cutoff") OffsetDateTime cutoff,
                        @Param("liveAt") OffsetDateTime liveAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Room r SET r.status = 'completed' WHERE r.roomId = :id AND r.status = 'live'")
    int completeIfLive(@Param("id") Long id);

    @Query(value = "SELECT DISTINCT r.* FROM rooms r " +
            "LEFT JOIN auction_items ai ON ai.room_id = r.room_id " +
            "LEFT JOIN products p ON p.product_id = ai.product_id " +
            "WHERE lower(r.title) LIKE lower(concat('%', :query, '%')) " +
            "OR lower(p.name) LIKE lower(concat('%', :query, '%')) " +
            "OR CAST(r.room_id AS text) = :query",
            nativeQuery = true)
    List<Room> search(@Param("query") String query);
}
