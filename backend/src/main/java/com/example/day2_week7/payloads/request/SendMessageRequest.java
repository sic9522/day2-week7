package com.example.day2_week7.payloads.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.Setter;

// FE STOMP payload is {chatId, text} (useChatSocket.js) — chatId is redundant with
// the destination path variable, so it's ignored here rather than mirrored.
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class SendMessageRequest {

	private String text;

}
