package com.example.bidverse.Repository;

import com.example.bidverse.Entity.Room;
import com.example.bidverse.Entity.auction_item;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuctionQueryTest {
    @Test
    void lifecycleMutationsRequireLiveRoomAndCompileWithoutDatabase() {
        var registry = new StandardServiceRegistryBuilder()
                .applySetting("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect")
                .applySetting("hibernate.boot.allow_jdbc_metadata_access", false)
                .applySetting("hibernate.hbm2ddl.auto", "none")
                .build();
        try (var factory = new MetadataSources(registry).addAnnotatedClass(Room.class)
                .addAnnotatedClass(auction_item.class).buildMetadata().buildSessionFactory();
             var session = factory.openSession()) {
            for (var method : AuctionItemRepository.class.getDeclaredMethods()) {
                if (!Set.of("activateIfWaiting", "acceptBidAndResetDeadline", "resolveExpiredIfLive").contains(method.getName())) continue;
                String query = method.getAnnotation(Query.class).value();
                assertTrue(query.contains("r.roomId = a.roomId AND r.status = 'live'"));
                assertDoesNotThrow(() -> session.createMutationQuery(query));
            }
        } finally {
            StandardServiceRegistryBuilder.destroy(registry);
        }
    }
}
