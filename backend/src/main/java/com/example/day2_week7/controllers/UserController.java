package com.example.day2_week7.controllers;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.day2_week7.payloads.response.UserResponse;
import com.example.day2_week7.payloads.response.UserSummaryResponse;
import com.example.day2_week7.services.CurrentUserService;
import com.example.day2_week7.services.UserService;

@RestController
@RequestMapping("/users")
public class UserController {

	private final UserService userService;
	private final CurrentUserService currentUserService;

	public UserController(UserService userService, CurrentUserService currentUserService) {
		this.userService = userService;
		this.currentUserService = currentUserService;
	}

	@GetMapping("/me")
	public UserResponse me(Authentication authentication) {
		return new UserResponse(currentUserService.get(authentication));
	}

	// toggle, not set: mirrors AuthContext.toggleReadReceipts() which takes no desired value
	@PatchMapping("/me/read-receipts")
	public UserResponse toggleReadReceipts(Authentication authentication) {
		return userService.toggleReadReceipts(currentUserService.get(authentication));
	}

	// backs the Home sidebar's "new users" list — 5 most recently registered
	@GetMapping
	public List<UserSummaryResponse> list(Authentication authentication) {
		return userService.listOthers(currentUserService.get(authentication));
	}

}
