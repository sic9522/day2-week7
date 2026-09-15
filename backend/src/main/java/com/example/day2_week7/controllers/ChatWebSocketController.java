package com.example.day2_week7.controllers;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import com.example.day2_week7.payloads.request.DeliveredRequest;
import com.example.day2_week7.payloads.request.SendMessageRequest;
import com.example.day2_week7.services.ChatService;

// destinations match useChatSocket.js: /app/chat/{id}/send + /app/chat/{id}/typing.
// The sender identity always comes from the authenticated STOMP session's
// Principal (set by StompAuthInterceptor on CONNECT), never from the payload.
@Controller
public class ChatWebSocketController {

	private final ChatService chatService;

	public ChatWebSocketController(ChatService chatService) {
		this.chatService = chatService;
	}

	@MessageMapping("/chat/{id}/send")
	public void send(@DestinationVariable Long id, @Payload SendMessageRequest request, Principal principal) {
		if (principal == null) return;
		chatService.sendMessage(principal.getName(), id, request.getText());
	}

	@MessageMapping("/chat/{id}/typing")
	public void typing(@DestinationVariable Long id, Principal principal) {
		if (principal == null) return;
		chatService.notifyTyping(principal.getName(), id);
	}

	@MessageMapping("/chat/{id}/delivered")
	public void delivered(@DestinationVariable Long id, @Payload DeliveredRequest request, Principal principal) {
		if (principal == null) return;
		chatService.markDelivered(principal.getName(), id, request.getMessageId());
	}

}
