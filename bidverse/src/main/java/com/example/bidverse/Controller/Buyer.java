package com.example.bidverse.Controller;

import com.example.bidverse.Dto.BookSeatRequest;
import com.example.bidverse.Dto.BookingSummary;
import com.example.bidverse.Dto.CatalogItem;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Entity.Room_Seat;
import com.example.bidverse.Service.BuyerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/buyer")
public class Buyer {

    private final BuyerService buyerService;

    public Buyer(BuyerService buyerService) {
        this.buyerService = buyerService;
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<List<CatalogItem>> getRoomCatalog(@PathVariable Long roomId) {
        return ResponseEntity.ok(buyerService.getRoomCatalog(roomId));
    }

    @GetMapping("/rooms/available")
    public ResponseEntity<List<Room>> getAvailableRooms() {
        return ResponseEntity.ok(buyerService.getAvailableRooms());
    }

    @GetMapping("/rooms/search")
    public ResponseEntity<List<Room>> searchRooms(@RequestParam String query) {
        return ResponseEntity.ok(buyerService.searchRooms(query));
    }

    @PostMapping("/rooms/{roomId}/book")
    public ResponseEntity<Room_Seat> bookRoom(@PathVariable Long roomId, @RequestBody BookSeatRequest request) {
        return ResponseEntity.ok(buyerService.bookRoom(roomId, request.buyerId()));
    }

    // GET /buyer/{buyerId}/bookings?status=upcoming|live|completed  (status optional -> all bookings)
    @GetMapping("/{buyerId}/bookings")
    public ResponseEntity<List<BookingSummary>> displayBookings(
            @PathVariable Long buyerId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(buyerService.displayBookings(buyerId, status));
    }

    // POST /buyer/rooms/{roomId}/join  { "buyerId": <id> }  -> only once the room is live and this buyer has a seat
    @PostMapping("/rooms/{roomId}/join")
    public ResponseEntity<List<CatalogItem>> joinRoom(@PathVariable Long roomId, @RequestBody BookSeatRequest request) {
        return ResponseEntity.ok(buyerService.joinRoom(roomId, request.buyerId()));
    }
}
