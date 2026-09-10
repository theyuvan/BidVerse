package com.example.bidverse.Service;

import com.example.bidverse.Dto.CreateRoomRequest;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Entity.auction_item;
import com.example.bidverse.Repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HostServiceTest {
    @Mock ProductRepository products;
    @Mock RoomRepo rooms;
    @Mock AuctionItemRepository lots;
    @Mock AuctionService auction;
    @Mock RoomCatalogEvents catalogEvents;
    HostService service;
    @BeforeEach void setup() { service = new HostService(products, rooms, lots, auction, catalogEvents); }
    Product product(long id, String status) {
        Product product = new Product();
        product.setProductId(id); product.setStatus(status); product.setBasePrice(new BigDecimal("100"));
        return product;
    }
    Room room(String status) {
        Room room = new Room(); room.setRoomId(5L); room.setHostId(1L); room.setStatus(status); return room;
    }
    CreateRoomRequest request(List<Long> ids) {
        return new CreateRoomRequest(" Collection ", 10, BigDecimal.ZERO, OffsetDateTime.now().plusDays(1), ids);
    }
    void saveRoom() {
        when(rooms.saveAndFlush(any())).thenAnswer(invocation -> {
            Room created = invocation.getArgument(0); created.setRoomId(5L); return created;
        });
    }
    auction_item lot(long id, long product) {
        return new auction_item(id, 5L, product, BigDecimal.TEN, BigDecimal.TEN, "waiting", null, null);
    }
    @Test void defaultSelectionAddsAvailableApprovedProductsAndAuthenticatedOwner() {
        ProductDisplayRow row = mock(ProductDisplayRow.class);
        when(row.getProductId()).thenReturn(101L);
        when(products.findAvailableApprovedProducts()).thenReturn(List.of(row));
        when(products.findByIdForUpdate(101L)).thenReturn(Optional.of(product(101, "approved")));
        saveRoom();
        Room created = service.createRoom(1L, request(null));
        assertEquals(1L, created.getHostId()); assertEquals("Collection", created.getTitle());
        assertEquals("upcoming", created.getStatus());
        verify(lots).save(argThat(item -> item.getProductId().equals(101L) && item.getRoomId().equals(5L)
                && item.getStatus().equals("waiting") && item.getStartPrice().compareTo(new BigDecimal("100")) == 0));
    }
    @Test void explicitEmptySelectionCreatesEmptyRoom() {
        saveRoom();
        service.createRoom(1L, request(List.of()));
        verifyNoInteractions(products, lots);
    }
    @Test void customSelectionDeduplicatesAndDoesNotAddOtherProducts() {
        when(products.findByIdForUpdate(102L)).thenReturn(Optional.of(product(102, "approved")));
        saveRoom();
        service.createRoom(1L, request(List.of(102L, 102L)));
        verify(products, never()).findAvailableApprovedProducts();
        verify(lots, times(1)).save(argThat(item -> item.getProductId().equals(102L)));
    }
    @Test void conflictingSelectionWritesNothing() {
        when(products.findByIdForUpdate(101L)).thenReturn(Optional.of(product(101, "approved")));
        when(products.findByIdForUpdate(102L)).thenReturn(Optional.of(product(102, "approved")));
        when(lots.existsByProductId(101L)).thenReturn(false);
        when(lots.existsByProductId(102L)).thenReturn(true);
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> service.createRoom(1L, request(List.of(101L, 102L)))).getStatusCode());
        verify(rooms, never()).saveAndFlush(any()); verify(lots, never()).save(any());
    }
    @Test void pendingProductsCannotBeAssigned() {
        when(products.findByIdForUpdate(101L)).thenReturn(Optional.of(product(101, "pending")));
        assertThrows(ResponseStatusException.class, () -> service.createRoom(1L, request(List.of(101L))));
        verify(rooms, never()).saveAndFlush(any());
    }
    @Test void invalidRoomIsRejectedBeforeWrites() {
        assertThrows(ResponseStatusException.class, () -> service.createRoom(1L,
                new CreateRoomRequest(" ", 0, BigDecimal.ZERO, null, List.of())));
        verifyNoInteractions(products, rooms, lots);
    }
    @Test void replacementRetainsExistingLotAndOnlyRemovesDeselectedProduct() {
        when(rooms.findByIdForUpdate(5L)).thenReturn(Optional.of(room("upcoming")));
        auction_item retained = lot(11, 101), removed = lot(12, 102);
        when(lots.findByRoomIdOrderByAuctionItemIdAsc(5L)).thenReturn(List.of(retained, removed));
        for (long id : List.of(101L, 102L, 103L))
            when(products.findByIdForUpdate(id)).thenReturn(Optional.of(product(id, "approved")));
        service.replaceRoomProducts(1L, 5L, List.of(101L, 103L));
        verify(lots).delete(removed); verify(lots, never()).delete(retained);
        verify(lots).save(argThat(item -> item.getProductId().equals(103L)));
        verify(lots, never()).save(retained);
    }
    @Test void failedReplacementDoesNotDeleteExistingLots() {
        when(rooms.findByIdForUpdate(5L)).thenReturn(Optional.of(room("upcoming")));
        when(lots.findByRoomIdOrderByAuctionItemIdAsc(5L)).thenReturn(List.of(lot(11, 101)));
        when(products.findByIdForUpdate(101L)).thenReturn(Optional.of(product(101, "approved")));
        when(products.findByIdForUpdate(102L)).thenReturn(Optional.of(product(102, "rejected")));
        assertThrows(ResponseStatusException.class, () -> service.replaceRoomProducts(1L, 5L, List.of(102L)));
        verify(lots, never()).delete(any()); verify(lots, never()).save(any());
    }
    @Test void anotherHostCannotEditCollection() {
        when(rooms.findByIdForUpdate(5L)).thenReturn(Optional.of(room("upcoming")));
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                () -> service.replaceRoomProducts(2L, 5L, List.of())).getStatusCode());
        verifyNoInteractions(products, lots);
    }
    @Test void waitingRoomCollectionIsLocked() {
        when(rooms.findByIdForUpdate(5L)).thenReturn(Optional.of(room("waiting")));
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> service.replaceRoomProducts(1L, 5L, List.of())).getStatusCode());
        verifyNoInteractions(products, lots);
    }
    @Test void startedLotCannotBeRemovedEvenIfRoomStatusIsStale() {
        when(rooms.findByIdForUpdate(5L)).thenReturn(Optional.of(room("upcoming")));
        auction_item sold = lot(11, 101); sold.setStatus("sold");
        when(lots.findByRoomIdOrderByAuctionItemIdAsc(5L)).thenReturn(List.of(sold));
        assertThrows(ResponseStatusException.class, () -> service.replaceRoomProducts(1L, 5L, List.of()));
        verify(lots, never()).delete(any());
    }
    @Test void cannotRejectProductAlreadyAssignedToAuction() {
        when(products.findByIdForUpdate(101L)).thenReturn(Optional.of(product(101, "approved")));
        when(lots.existsByProductId(101L)).thenReturn(true);
        assertThrows(ResponseStatusException.class, () -> service.verifyProduct(101L, "rejected"));
        verify(products, never()).save(any());
    }
}
