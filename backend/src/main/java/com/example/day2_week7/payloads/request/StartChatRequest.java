package com.example.day2_week7.payloads.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StartChatRequest {

	// validated in ChatService, not here, to reuse the FE's own error copy
	// ("Inserisci uno username" / "Non puoi scrivere a te stesso")
	private String username;

}
