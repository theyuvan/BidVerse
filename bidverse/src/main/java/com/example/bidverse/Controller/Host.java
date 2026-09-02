package com.example.bidverse.Controller;


import com.example.bidverse.Dto.ProductStatus;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Repository.ProductRepository;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Repository.RoomRepo;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.example.bidverse.Dto.UpdateRoom;

import java.util.List;
import java.time.OffsetDateTime;

@RestController
@RequestMapping("/host")
public class Host {

    private static final String STATUS_APPROVED = "approved";
    private static final String STATUS_REJECTED = "rejected";

    private final ProductRepository productRepo;
    private final RoomRepo roomRepo;
    public Host(ProductRepository productRepo,RoomRepo roomRepo) {
        this.productRepo = productRepo;
        this.roomRepo = roomRepo;
    }

//    @GetMapping("/products/pending")
//    public ResponseEntity<List<Product>> getPendingProducts() {
//
//        return ResponseEntity.ok(
//                productRepo.findByStatus("pending")
//        );
//    }

    @PostMapping("/products/{productId}/verify")
    public ResponseEntity<?> verifyProduct(
            @PathVariable Long productId,
            @RequestBody ProductStatus request) {

        String decision =
                request.status() == null
                        ? ""
                        : request.status().trim().toLowerCase();

        if (!decision.equalsIgnoreCase(STATUS_APPROVED)
                && !decision.equalsIgnoreCase(STATUS_REJECTED)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "status must be APPROVED or REJECTED"
            );
        }

        Product product = productRepo.findById(productId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Product not found"
                        )
                );

        product.setStatus(decision);

        productRepo.save(product);

        return new ResponseEntity<>(
                "Product Verified Successfully",
                HttpStatus.OK
        );
    }

    @PutMapping("/rooms/{roomId}/start")
    public ResponseEntity<?> startRoom(@PathVariable Long roomId) {

        Room room = roomRepo.findById(roomId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Room Not Found"));
        room.setStatus("LIVE");
        room.setStartTime(OffsetDateTime.now());

        roomRepo.save(room);

        return new ResponseEntity<>(
                "Room Started Successfully",
                HttpStatus.OK
        );
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts(@RequestParam String status) {
        return ResponseEntity.ok(productRepo.findByStatus(status.toLowerCase()));
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<Room> getRoomDetails(@PathVariable Long roomId) {
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));
        return ResponseEntity.ok(room);
    }

    @PatchMapping("/rooms/{roomId}")
    public ResponseEntity<?> updateRoom(
            @PathVariable Long roomId,
            @RequestBody UpdateRoom dto) {

        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        room.setSeatLimit(dto.seatLimit());

        roomRepo.save(room);

        return new ResponseEntity<>(
                "Room capacity updated successfully",
                HttpStatus.OK
        );
    }


}