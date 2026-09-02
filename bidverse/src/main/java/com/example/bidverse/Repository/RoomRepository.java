package com.example.bidverse.Repository;
import com.example.bidverse.Entity.Room;
import org.springframework.data.repository.Repository;
public interface RoomRepository extends Repository<Room,Integer> {
    Room findById(Long roomId);
    void save(Room room);
}