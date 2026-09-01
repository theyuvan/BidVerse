package com.example.bidverse.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "room_seats")
public class Room_Seat {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_seat_id")
    private Long roomSeatId;
    @Column(name = "room_id", nullable = false)
    private Long roomId;
    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;
    @Column(name = "advance_amount", nullable = false)
    private Double advanceAmount;
    @Column(name = "advance_status", nullable = false)
    private String advance_status = "booked";
    
}
