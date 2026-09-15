package com.example.day2_week7.payloads.response;

import com.example.day2_week7.entities.User;

import lombok.Getter;

@Getter
public class AuthResponse {

	private final String token;
	private final UserResponse user;

	public AuthResponse(String token, User user) {
		this.token = token;
		this.user = new UserResponse(user);
	}

}
