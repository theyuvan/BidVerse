package com.example.bidverse.Service;

import com.example.bidverse.Dto.BookingSummary;
import com.example.bidverse.Dto.CatalogItem;
import com.example.bidverse.Dto.LiveAuctionItem;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Entity.Room_Seat;
import com.example.bidverse.Repository.AuctionItemRepository;
import com.example.bidverse.Repository.RoomRepo;
import com.example.bidverse.Repository.RoomSeatRepository;
import com.example.bidverse.Repository.DealRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.time.OffsetDateTime;
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
    private static final String ROOM_STATUS_CANCELLED = "cancelled";
    private static final String ADVANCE_STATUS_PAID = "paid";
    private static final int BID_DURATION_SECONDS = 90;
    private static final long MIN_ROOM_DURATION_SECONDS = 3600;

    private final RoomRepo roomRepo;
    private final AuctionItemRepository auctionItemRepo;
    private final RoomSeatRepository roomSeatRepo;
    private final DealRepository dealRepo;

    public BuyerService(RoomRepo roomRepo, AuctionItemRepository auctionItemRepo, RoomSeatRepository roomSeatRepo, DealRepository dealRepo) {
        this.roomRepo = roomRepo;
        this.auctionItemRepo = auctionItemRepo;
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

        return auctionItemRepo.findCatalogByRoomId(roomId).stream()
                .map(row -> new CatalogItem(
                        row.getAuctionItemId(),
                        row.getProductId(),
                        row.getProductName(),
                        row.getDescription(),
                        row.getCategoryName()
                ))
                .toList();
    }

    public Room_Seat bookRoom(Long roomId, Long buyerId) {

        Room room = roomRepo.findById(roomId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        if (!BOOKABLE_ROOM_STATUSES.contains(room.getStatus() == null ? "" : room.getStatus().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room is not open for booking");
        }

        if (roomSeatRepo.existsByRoomIdAndBuyerId(roomId, buyerId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Buyer already has a seat booked in this room");
        }

        assertNoOverlappingBooking(room, buyerId);

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

    private void assertNoOverlappingBooking(Room room, Long buyerId) {
        List<Room_Seat> existingBookings = roomSeatRepo.findByBuyerId(buyerId);
        if (existingBookings.isEmpty()) {
            return;
        }

        List<Long> otherRoomIds = existingBookings.stream()
                .map(Room_Seat::getRoomId)
                .filter(id -> !id.equals(room.getRoomId()))
                .collect(Collectors.toList());
        if (otherRoomIds.isEmpty()) {
            return;
        }

        OffsetDateTime newStart = room.getStartTime();
        OffsetDateTime newEnd = estimateRoomEndTime(room);

        List<Room> otherRooms = roomRepo.findAllById(otherRoomIds);
        for (Room otherRoom : otherRooms) {
            if (ROOM_STATUS_CANCELLED.equalsIgnoreCase(otherRoom.getStatus())) {
                continue;
            }

            OffsetDateTime otherStart = otherRoom.getStartTime();
            OffsetDateTime otherEnd = estimateRoomEndTime(otherRoom);

            boolean overlaps = newStart.isBefore(otherEnd) && otherStart.isBefore(newEnd);
            if (overlaps) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Buyer already has a seat booked in \"" + otherRoom.getTitle() + "\" during this time slot");
            }
        }
    }

    private OffsetDateTime estimateRoomEndTime(Room room) {
        long itemCount = auctionItemRepo.findByRoomId(room.getRoomId()).size();
        long durationSeconds = Math.max(itemCount * (long) BID_DURATION_SECONDS, MIN_ROOM_DURATION_SECONDS);
        return room.getStartTime().plusSeconds(durationSeconds);
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

    public List<LiveAuctionItem> joinRoom(Long roomId, Long buyerId) {
        Room room = roomRepo.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room Not Found"));

        if (!ROOM_STATUS_LIVE.equalsIgnoreCase(room.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room is not live yet");
        }

        if (!roomSeatRepo.existsByRoomIdAndBuyerId(roomId, buyerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You must book a seat in this room before joining");
        }

        return auctionItemRepo.findLiveAuctionItemsByRoomId(roomId).stream()
                .map(row -> new LiveAuctionItem(
                        row.getAuctionItemId(),
                        row.getProductId(),
                        row.getProductName(),
                        row.getCategoryName(),
                        row.getSellerName(),
                        row.getBasePrice(),
                        row.getCurrentPrice(),
                        row.getAuctionStatus()
                ))
                .toList();
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
