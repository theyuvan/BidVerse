package com.example.bidverse.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.OffsetDateTime;
import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long roomId;
    @Column(name = "host_id", nullable = false)
    private Long hostId;
    @Column(name = "title", nullable = false, unique = true)
    private String title;
    @Column(name = "seat_limit", nullable = false)
    private Integer seatLimit;
    @Column(name = "advance_amount", nullable = false)
    private BigDecimal advanceAmount;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "start_time", nullable = false)
    private OffsetDateTime startTime;

}
