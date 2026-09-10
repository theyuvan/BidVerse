package com.example.bidverse.Service;

import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class RoomCatalogEventsTest {
    @Test void publishesOnlyAfterSuccessfulCommit() {
        var messaging = mock(SimpMessagingTemplate.class);
        TransactionSynchronizationManager.initSynchronization();
        try {
            new RoomCatalogEvents(messaging).changed();
            verifyNoInteractions(messaging);
            TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
            verify(messaging).convertAndSend(eq("/topic/rooms"), any(Object.class));
        } finally { TransactionSynchronizationManager.clearSynchronization(); }
    }

    @Test void rolledBackRoomDoesNotSendNotification() {
        var messaging = mock(SimpMessagingTemplate.class);
        TransactionSynchronizationManager.initSynchronization();
        try {
            new RoomCatalogEvents(messaging).changed();
            TransactionSynchronizationManager.getSynchronizations().forEach(sync -> sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
            verifyNoInteractions(messaging);
        } finally { TransactionSynchronizationManager.clearSynchronization(); }
    }
}
