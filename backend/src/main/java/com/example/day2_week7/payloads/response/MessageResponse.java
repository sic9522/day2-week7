package com.example.day2_week7.payloads.response;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import com.example.day2_week7.entities.Message;
import com.example.day2_week7.entities.MessageStatus;
import com.example.day2_week7.entities.User;

import lombok.Getter;

@Getter
public class MessageResponse {

	// withZone is required to format an Instant with an HH:mm-only pattern —
	// an Instant alone has no notion of "wall clock time", only the zone gives it one
	private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.systemDefault());

	private final Long id;
	private final Long chatId;
	private final boolean mine;
	private final String text;
	private final String time;
	private final MessageStatus status;
	private final String senderUsername;

	private MessageResponse(Long id, Long chatId, boolean mine, String text, String time, MessageStatus status,
			String senderUsername) {
		this.id = id;
		this.chatId = chatId;
		this.mine = mine;
		this.text = text;
		this.time = time;
		this.status = status;
		this.senderUsername = senderUsername;
	}

	public static MessageResponse from(Message message, User viewer) {
		boolean mine = message.getSender().getId().equals(viewer.getId());
		return new MessageResponse(
			message.getId(),
			message.getChat().getId(),
			mine,
			message.getText(),
			TIME_FORMAT.format(message.getSentAt()),
			message.getStatus(),
			message.getSender().getUsername()
		);
	}

}
