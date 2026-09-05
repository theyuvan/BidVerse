package com.example.bidverse.Repository;

import com.example.bidverse.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
}
