package com.example.bidverse.Controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.bidverse.Dto.AssignRoomRequest;
import com.example.bidverse.Dto.ProductDisplay;
import com.example.bidverse.Dto.ProductStatus;
import com.example.bidverse.Dto.RoomProduct;
import com.example.bidverse.Dto.UpdateRoom;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Service.HostService;

@RestController
@RequestMapping("/host")
public class Host {

    private final HostService hostService;

    public Host(HostService hostService) {
        this.hostService = hostService;
    }

    @GetMapping("/products/pending")
    public ResponseEntity<List<ProductDisplay>> getPendingProducts() {
        return ResponseEntity.ok(hostService.getProducts("pending"));
    }

    @GetMapping("/products/approved")
    public ResponseEntity<List<ProductDisplay>> getApprovedProducts() {
        return ResponseEntity.ok(hostService.getProducts("approved"));
    }

    @GetMapping("/products/rejected")
    public ResponseEntity<List<ProductDisplay>> getRejectedProducts() {
        return ResponseEntity.ok(hostService.getProducts("rejected"));
    }

    @PostMapping("/products/{productId}/verify")
    public ResponseEntity<?> verifyProduct(@PathVariable Long productId, @RequestBody ProductStatus request) {
        hostService.verifyProduct(productId, request.status());
        return new ResponseEntity<>("Product Verified Successfully", HttpStatus.OK);
    }

    @PostMapping("/products/{productId}/assignRoom")
    public ResponseEntity<?> assignProductToRoom(@PathVariable Long productId, @RequestBody AssignRoomRequest request) {
        hostService.assignProductToRoom(productId, request.roomId());
        return new ResponseEntity<>("Product added to room successfully", HttpStatus.OK);
    }

    @PutMapping("/rooms/{roomId}/start")
    public ResponseEntity<?> startRoom(@PathVariable Long roomId) {
        hostService.startRoom(roomId);
        return new ResponseEntity<>("Room Started Successfully", HttpStatus.OK);
    }

    @GetMapping("/products")
    public ResponseEntity<List<ProductDisplay>> getProducts(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(hostService.getProducts(status));
    }

    @GetMapping("/products/available")
    public ResponseEntity<List<ProductDisplay>> getAvailableApprovedProducts() {
        return ResponseEntity.ok(hostService.getAvailableApprovedProducts());
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<Room> getRoomDetails(@PathVariable Long roomId) {
        return ResponseEntity.ok(hostService.getRoomDetails(roomId));
    }

    @GetMapping("/rooms/{roomId}/products")
    public ResponseEntity<List<RoomProduct>> getRoomProducts(@PathVariable Long roomId) {
        return ResponseEntity.ok(hostService.getRoomProducts(roomId));
    }

    @PatchMapping("/rooms/{roomId}")
    public ResponseEntity<?> updateRoom(@PathVariable Long roomId, @RequestBody UpdateRoom dto) {
        hostService.updateRoomCapacity(roomId, dto.seatLimit());
        return new ResponseEntity<>("Room capacity updated successfully", HttpStatus.OK);
    }

    @GetMapping("/rooms")
    public ResponseEntity<?> getAllRooms() {
        return new ResponseEntity<>(hostService.getAllRooms(), HttpStatus.OK);
    }

    @PostMapping("/rooms")
    public ResponseEntity<?> createRoom(@RequestBody Room room) {
        hostService.createRoom(room);
        return new ResponseEntity<>("Room Created Successfully", HttpStatus.CREATED);
    }
}
