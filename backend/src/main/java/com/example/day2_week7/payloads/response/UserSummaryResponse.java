package com.example.day2_week7.payloads.response;

import com.example.day2_week7.entities.User;

import lombok.Getter;

// public-facing user shape for the "who can I chat with" list — no email,
// unlike UserResponse which is only ever returned for the owner's own profile
@Getter
public class UserSummaryResponse {

	private final Long id;
	private final String nome;
	private final String cognome;
	private final String username;
	private final boolean online;

	public UserSummaryResponse(User user, boolean online) {
		this.id = user.getId();
		this.nome = user.getNome();
		this.cognome = user.getCognome();
		this.username = user.getUsername();
		this.online = online;
	}

}
