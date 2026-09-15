package com.example.day2_week7.payloads.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

// mirrors mockChats.js shape (id, name, lastMessage, time, unread, online);
// "messages" is deliberately left out here, fetched separately via /chats/{id}/messages
@Getter
@AllArgsConstructor
public class ChatResponse {

	private final Long id;
	private final String name;
	private final String withUsername;
	private final String lastMessage;
	private final String time;
	private final long unread;
	private final boolean online;

}
