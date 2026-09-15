package com.example.day2_week7.security;

import java.util.List;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

// reads the same "Authorization: Bearer <token>" header the FE already sends on
// REST calls (services/api.js), but as a STOMP native header on CONNECT — lets
// PresenceService and the chat handlers know who's on the socket.
@Component
public class StompAuthInterceptor implements ChannelInterceptor {

	private final JwtService jwtService;

	public StompAuthInterceptor(JwtService jwtService) {
		this.jwtService = jwtService;
	}

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		// getAccessor (not wrap!) retrieves the mutable accessor the STOMP sub-protocol
		// handler already attached to this message — mutating it here is what actually
		// carries the Principal forward; wrap() builds a detached copy whose mutations
		// are silently lost when the original, unmodified `message` is returned below
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

		if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
			String header = accessor.getFirstNativeHeader("Authorization");
			if (header != null && header.startsWith("Bearer ")) {
				String token = header.substring(7);
				if (jwtService.isValid(token)) {
					String username = jwtService.extractUsername(token);
					accessor.setUser(new UsernamePasswordAuthenticationToken(username, null, List.of()));
				}
			}
		}

		return message;
	}

}
