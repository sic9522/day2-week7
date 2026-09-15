package com.example.day2_week7.payloads.response;

import com.example.day2_week7.entities.User;

import lombok.Getter;

// mirrors the FE's user shape (AuthContext) incl. nested settings.readReceipts
@Getter
public class UserResponse {

	private final Long id;
	private final String nome;
	private final String cognome;
	private final String username;
	private final String email;
	private final Settings settings;

	public UserResponse(User user) {
		this.id = user.getId();
		this.nome = user.getNome();
		this.cognome = user.getCognome();
		this.username = user.getUsername();
		this.email = user.getEmail();
		this.settings = new Settings(user.isReadReceipts());
	}

	@Getter
	public static class Settings {
		private final boolean readReceipts;

		public Settings(boolean readReceipts) {
			this.readReceipts = readReceipts;
		}
	}

}
