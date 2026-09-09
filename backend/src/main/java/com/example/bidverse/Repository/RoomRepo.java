
package com.example.bidverse.Repository;
import com.example.bidverse.Entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface RoomRepo extends JpaRepository<Room, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Room r where r.roomId = :id")
    java.util.Optional<Room> findByIdForUpdate(@Param("id") Long id);

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






    @Query(value = """
            select r.* from rooms r
            where lower(r.status) not in ('waiting','live','completed','cancelled')
              and not exists (
                  select 1 from room_seats rs where rs.room_id = r.room_id and rs.buyer_id = :buyerId
              )
            """, nativeQuery = true)
    List<Room> findAvailableForBuyer(@Param("buyerId") Long buyerId);

    @Query(value = """
            select distinct r.* from rooms r
            left join auction_items ai on ai.room_id = r.room_id
            left join products p on p.product_id = ai.product_id
            where lower(r.status) not in ('waiting','live','completed','cancelled')
              and not exists (
                  select 1 from room_seats rs where rs.room_id = r.room_id and rs.buyer_id = :buyerId
              )
              and (
                  lower(r.title) like lower(concat('%', :query, '%'))
                  or lower(p.name) like lower(concat('%', :query, '%'))
                  or cast(r.room_id as text) = :query
              )
            """, nativeQuery = true)
    List<Room> searchAvailableForBuyer(@Param("buyerId") Long buyerId, @Param("query") String query);
}
