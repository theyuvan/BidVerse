package com.example.bidverse.Service;

import com.example.bidverse.Dto.LoginRequest;
import com.example.bidverse.Dto.RegisterRequest;
import com.example.bidverse.Entity.User;
import com.example.bidverse.Repository.UserRepository;
import org.springframework.stereotype.Service;
@Service
public class AuthService {
    private final UserRepository userRepository;
    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    public String register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return "Email already registered";
        }
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(request.getPassword());
        user.setRole(request.getRole());
        userRepository.save(user);
        return "Registration successful";
    }
    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail()) .orElse(null);
        if (user == null) {
            return "User not found";
        }
        if (!user.getPassword().equals(request.getPassword())) {
            return "Invalid password";
        }
        if (!user.getRole().equalsIgnoreCase(request.getRole())) {
            return "Invalid role";
        }
        return "Login successful";
    }
}