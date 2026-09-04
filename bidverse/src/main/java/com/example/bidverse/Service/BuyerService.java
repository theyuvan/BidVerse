package com.example.bidverse.Service;

import com.example.bidverse.Dto.BookingSummary;
import com.example.bidverse.Dto.CatalogItem;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Entity.Room_Seat;
import com.example.bidverse.Entity.auction_item;
import com.example.bidverse.Repository.AuctionItemRepository;
import com.example.bidverse.Repository.ProductRepository;
import com.example.bidverse.Repository.RoomRepo;
import com.example.bidverse.Repository.RoomSeatRepository;
import com.example.bidverse.Repository.DealRepository;

import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BuyerService {

    private static final List<String> STARTED_ROOM_STATUSES = List.of("live", "completed", "cancelled");
    private static final List<String> BOOKABLE_ROOM_STATUSES = List.of("upcoming", "open");
    private static final List<String> UPCOMING_ROOM_STATUSES = List.of("upcoming", "open");
    private static final String ROOM_STATUS_LIVE = "live";
    private static final String ROOM_STATUS_COMPLETED = "completed";
    private static final String ADVANCE_STATUS_PAID = "paid";

    private final RoomRepo roomRepo;
    private final AuctionItemRepository auctionItemRepo;
    private final ProductRepository productRepo;
    private final RoomSeatRepository roomSeatRepo;
    private final DealRepository dealRepo;

    public BuyerService(RoomRepo roomRepo, AuctionItemRepository auctionItemRepo, ProductRepository productRepo, RoomSeatRepository roomSeatRepo , DealRepository dealRepo) {
        this.roomRepo = roomRepo;
        this.auctionItemRepo = auctionItemRepo;
        this.productRepo = productRepo;
        this.roomSeatRepo = roomSeatRepo;
        this.dealRepo = dealRepo;
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

    public List<BookingSummary> displayBookings(Long buyerId, String status) {

        String filter = status == null || status.isBlank() ? null : status.trim().toLowerCase();
        if (filter != null && !filter.equals("upcoming") && !filter.equals("live") && !filter.equals("completed")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be one of: upcoming, live, completed");
        }

        List<Room_Seat> bookings = roomSeatRepo.findByBuyerId(buyerId);

        List<Long> roomIds = bookings.stream().map(Room_Seat::getRoomId).collect(Collectors.toList());
        Map<Long, Room> roomsById = roomRepo.findAllById(roomIds).stream()
                .collect(Collectors.toMap(Room::getRoomId, Function.identity()));

        return bookings.stream()
                .map(seat -> {
                    Room room = roomsById.get(seat.getRoomId());
                    String roomStatus = room == null ? null : room.getStatus();
                    return new BookingSummary(
                            seat.getRoomSeatId(),
                            seat.getRoomId(),
                            room == null ? null : room.getTitle(),
                            roomStatus,
                            room == null ? null : room.getStartTime(),
                            seat.getAdvanceAmount(),
                            seat.getAdvanceStatus(),
                            ROOM_STATUS_LIVE.equalsIgnoreCase(roomStatus)
                    );
                })
                .filter(booking -> matchesStatusFilter(booking.roomStatus(), filter))
                .collect(Collectors.toList());
    }

    private boolean matchesStatusFilter(String roomStatus, String filter) {
        if (filter == null) {
            return true;
        }
        String normalizedStatus = roomStatus == null ? "" : roomStatus.toLowerCase();
        return switch (filter) {
            case "upcoming" -> UPCOMING_ROOM_STATUSES.contains(normalizedStatus);
            case "live" -> ROOM_STATUS_LIVE.equals(normalizedStatus);
            case "completed" -> ROOM_STATUS_COMPLETED.equals(normalizedStatus);
            default -> false;
        };
    }

    public List<CatalogItem> joinRoom(Long roomId, Long buyerId) {
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        if (!ROOM_STATUS_LIVE.equalsIgnoreCase(room.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room is not live yet");
        }

        if (!roomSeatRepo.existsByRoomIdAndBuyerId(roomId, buyerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You must book a seat in this room before joining");
        }

        return getRoomCatalog(roomId);
    }

    public List<Deal> getAllDeals() {
        return dealRepo.findAll();
    }

    public List<Deal> getDealId(Long dealId) {
        return dealRepo.findById(dealId).map(Collections::singletonList).orElse(Collections.emptyList());
    }

    public List<Deal> confirmDeal(Long dealId) {
        Deal deal = dealRepo.findById(dealId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deal Not Found"));

        if (!"pending".equalsIgnoreCase(deal.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Deal is not in a confirmable state");
        }

        if (!"pending".equalsIgnoreCase(deal.getBuyerStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Deal is not in a confirmable state");
        }

        deal.setBuyerStatus("confirmed");
        dealRepo.save(deal);

        return Collections.singletonList(deal);
    }

    public List<Deal> rejectDeal(Long dealId , String reason) {
        Deal deal = dealRepo.findById(dealId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deal Not Found"));

        if (!"pending".equalsIgnoreCase(deal.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Deal is not in a rejectable state");
        }
        
        if (!"pending".equalsIgnoreCase(deal.getBuyerStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Deal is not in a rejectable state");
        }

        deal.setBuyerStatus("rejected");
        deal.setCancelReason(reason);

        dealRepo.save(deal);

        return Collections.singletonList(deal);
    }
}