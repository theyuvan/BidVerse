package com.example.bidverse.Service;

import com.example.bidverse.Dto.CatalogItem;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Entity.Room_Seat;
import com.example.bidverse.Entity.auction_item;
import com.example.bidverse.Repository.AuctionItemRepository;
import com.example.bidverse.Repository.ProductRepository;
import com.example.bidverse.Repository.RoomRepo;
import com.example.bidverse.Repository.RoomSeatRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BuyerService {

    private static final List<String> STARTED_ROOM_STATUSES = List.of("live", "completed", "cancelled");
    private static final List<String> BOOKABLE_ROOM_STATUSES = List.of("upcoming", "open");
    private static final String ADVANCE_STATUS_PAID = "paid";

    private final RoomRepo roomRepo;
    private final AuctionItemRepository auctionItemRepo;
    private final ProductRepository productRepo;
    private final RoomSeatRepository roomSeatRepo;

    public BuyerService(RoomRepo roomRepo, AuctionItemRepository auctionItemRepo, ProductRepository productRepo, RoomSeatRepository roomSeatRepo) {
        this.roomRepo = roomRepo;
        this.auctionItemRepo = auctionItemRepo;
        this.productRepo = productRepo;
        this.roomSeatRepo = roomSeatRepo;
    }

    public List<Room> getAvailableRooms() {
        return roomRepo.findByStatusNotIn(STARTED_ROOM_STATUSES);
    }

    public List<Room> searchRooms(String query) {
        if (query == null || query.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "query must not be empty");
        }
        return roomRepo.search(query.trim());
    }

    public List<CatalogItem> getRoomCatalog(Long roomId) {

        roomRepo.findById(roomId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        List<auction_item> items = auctionItemRepo.findByRoomId(roomId);

        List<Long> productIds = items.stream().map(auction_item::getProductId).collect(Collectors.toList());

        Map<Long, Product> productsById = productRepo.findAllById(productIds).stream().collect(Collectors.toMap(Product::getProductId, Function.identity()));

        return items.stream()
                .map(item -> {
                    Product product = productsById.get(item.getProductId());
                    return new CatalogItem(
                            item.getAuctionItemId(),
                            item.getProductId(),
                            product == null ? null : product.getName(),
                            product == null ? null : product.getDescription(),
                            product == null ? null : product.getCategoryId(),
                            product == null ? null : product.getBasePrice(),
                            item.getCurrentPrice(),
                            item.getStatus()
                    );
                })
                .collect(Collectors.toList());
    }

    public Room_Seat bookRoom(Long roomId, Long buyerId) {

        Room room = roomRepo.findById(roomId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        if (!BOOKABLE_ROOM_STATUSES.contains(room.getStatus() == null ? "" : room.getStatus().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room is not open for booking");
        }

        if (roomSeatRepo.existsByRoomIdAndBuyerId(roomId, buyerId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Buyer already has a seat booked in this room");
        }

        long bookedSeats = roomSeatRepo.countByRoomId(roomId);
        if (bookedSeats >= room.getSeatLimit()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room is fully booked");
        }

        Room_Seat seat = new Room_Seat();
        seat.setRoomId(roomId);
        seat.setBuyerId(buyerId);
        seat.setAdvanceAmount(room.getAdvanceAmount());
        seat.setAdvanceStatus(ADVANCE_STATUS_PAID);

        return roomSeatRepo.save(seat);
    }
}
