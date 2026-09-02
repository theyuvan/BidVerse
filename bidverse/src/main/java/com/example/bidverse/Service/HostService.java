package com.example.bidverse.Service;

import com.example.bidverse.Entity.Product;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Repository.ProductRepository;
import com.example.bidverse.Repository.RoomRepo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class HostService {

    private static final String STATUS_APPROVED = "approved";
    private static final String STATUS_REJECTED = "rejected";

    private final ProductRepository productRepo;
    private final RoomRepo roomRepo;

    public HostService(ProductRepository productRepo, RoomRepo roomRepo) {
        this.productRepo = productRepo;
        this.roomRepo = roomRepo;
    }

    public Product verifyProduct(Long productId, String status) {
        String decision = status == null ? "" : status.trim().toLowerCase();

        if (!decision.equalsIgnoreCase(STATUS_APPROVED) && !decision.equalsIgnoreCase(STATUS_REJECTED)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be APPROVED or REJECTED");
        }

        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        product.setStatus(decision);
        return productRepo.save(product);
    }

    public Room startRoom(Long roomId) {
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        room.setStatus("LIVE");
        room.setStartTime(OffsetDateTime.now());
        return roomRepo.save(room);
    }

    public List<Product> getAllProducts(String status) {
        return productRepo.findByStatus(status.toLowerCase());
    }

    public Room getRoomDetails(Long roomId) {
        return roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));
    }

    public Room updateRoomCapacity(Long roomId, Integer seatLimit) {
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        room.setSeatLimit(seatLimit);
        return roomRepo.save(room);
    }
}
