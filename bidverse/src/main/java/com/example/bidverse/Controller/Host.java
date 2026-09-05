package com.example.bidverse.Controller;


import com.example.bidverse.Dto.AssignRoomRequest;
import com.example.bidverse.Dto.ProductDisplay;
import com.example.bidverse.Dto.ProductStatus;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Service.HostService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.bidverse.Dto.UpdateRoom;

import java.util.List;

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
    public ResponseEntity<?> assignProductToRoom(@PathVariable Long productId,@RequestBody AssignRoomRequest request) {
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

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<Room> getRoomDetails(@PathVariable Long roomId) {
        return ResponseEntity.ok(hostService.getRoomDetails(roomId));
    }

    @PatchMapping("/rooms/{roomId}")
    public ResponseEntity<?> updateRoom(@PathVariable Long roomId,@RequestBody UpdateRoom dto) {
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
        return new ResponseEntity<>("Room Created Successfully",HttpStatus.CREATED);
    }
}