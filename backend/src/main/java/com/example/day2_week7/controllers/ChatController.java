package com.example.day2_week7.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.day2_week7.payloads.request.StartChatRequest;
import com.example.day2_week7.payloads.response.ChatResponse;
import com.example.day2_week7.payloads.response.MessageResponse;
import com.example.day2_week7.services.ChatService;
import com.example.day2_week7.services.CurrentUserService;

@RestController
@RequestMapping("/chats")
public class ChatController {

	private final ChatService chatService;
	private final CurrentUserService currentUserService;

	public ChatController(ChatService chatService, CurrentUserService currentUserService) {
		this.chatService = chatService;
		this.currentUserService = currentUserService;
	}

	@GetMapping
	public List<ChatResponse> list(Authentication authentication) {
		return chatService.listChats(currentUserService.get(authentication));
	}

	@PostMapping
	public ChatResponse start(Authentication authentication, @RequestBody StartChatRequest request) {
		return chatService.startChat(currentUserService.get(authentication), request.getUsername());
	}

	// beforeId unset -> latest page; set -> older messages before that id (ChatThread's scroll-up paging)
	@GetMapping("/{id}/messages")
	public List<MessageResponse> messages(
			Authentication authentication,
			@PathVariable Long id,
			@RequestParam(required = false) Long beforeId,
			@RequestParam(defaultValue = "10") int size) {
		return chatService.getMessages(currentUserService.get(authentication), id, beforeId, size);
	}

	@PatchMapping("/{id}/read")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void markRead(Authentication authentication, @PathVariable Long id) {
		chatService.markRead(currentUserService.get(authentication), id);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(Authentication authentication, @PathVariable Long id) {
		chatService.deleteChat(currentUserService.get(authentication), id);
	}

}
