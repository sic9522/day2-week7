package com.example.day2_week7.controllers;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.day2_week7.payloads.request.LoginRequest;
import com.example.day2_week7.payloads.request.RegisterRequest;
import com.example.day2_week7.payloads.response.AuthResponse;
import com.example.day2_week7.services.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

	private final UserService userService;

	public AuthController(UserService userService) {
		this.userService = userService;
	}

	@PostMapping("/register")
	public AuthResponse register(@RequestBody @Valid RegisterRequest request) {
		return userService.register(request);
	}

	@PostMapping("/login")
	public AuthResponse login(@RequestBody @Valid LoginRequest request) {
		return userService.login(request);
	}

}
