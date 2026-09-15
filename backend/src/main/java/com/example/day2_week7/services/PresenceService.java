package com.example.day2_week7.services;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.example.day2_week7.entities.Message;
import com.example.day2_week7.entities.MessageStatus;
import com.example.day2_week7.entities.User;
import com.example.day2_week7.repositories.MessageRepository;
import com.example.day2_week7.repositories.UserRepository;

// ponytail: in-memory only (single instance, lost on restart) — good enough for
// this app's scale. Move to Redis/shared store if it ever runs on >1 instance.
@Service
public class PresenceService {

	// counts active sessions per username, not just a membership set: with two
	// tabs/devices open, closing one must not mark the user offline while the
	// other is still connected
	private final Map<String, Integer> sessionCounts = new ConcurrentHashMap<>();
	private final SimpMessagingTemplate messagingTemplate;
	private final MessageRepository messageRepository;
	private final UserRepository userRepository;

	// depends on the repositories directly, not ChatService — ChatService
	// already depends on PresenceService (for the online dot), so the other
	// way round would be a circular dependency
	public PresenceService(SimpMessagingTemplate messagingTemplate, MessageRepository messageRepository,
			UserRepository userRepository) {
		this.messagingTemplate = messagingTemplate;
		this.messageRepository = messageRepository;
		this.userRepository = userRepository;
	}

	@EventListener
	public void onConnect(SessionConnectedEvent event) {
		Principal user = event.getUser();
		if (user == null) return;

		int count = sessionCounts.merge(user.getName(), 1, Integer::sum);
		if (count == 1) {
			broadcast(user.getName(), true);
			deliverPendingMessages(user.getName());
		}
	}

	@EventListener
	public void onDisconnect(SessionDisconnectEvent event) {
		Principal user = event.getUser();
		if (user == null) return;

		int count = sessionCounts.merge(user.getName(), -1, Integer::sum);
		if (count <= 0) {
			sessionCounts.remove(user.getName());
			broadcast(user.getName(), false);
		}
	}

	public boolean isOnline(String username) {
		return sessionCounts.getOrDefault(username, 0) > 0;
	}

	// flushes the backlog the instant this user comes online — not just the
	// chat they happen to open first. Each sender gets the same live tick
	// update they'd get from a real-time ack (ChatsContext reacts to
	// /queue/delivered the same way regardless of where it came from).
	private void deliverPendingMessages(String username) {
		User me = userRepository.findByUsername(username).orElse(null);
		if (me == null) return;

		List<Message> pending = messageRepository.findPendingFor(MessageStatus.SENT, me);
		for (Message message : pending) {
			message.setStatus(MessageStatus.DELIVERED);
			messageRepository.save(message);
			messagingTemplate.convertAndSendToUser(
				message.getSender().getUsername(),
				"/queue/delivered",
				new ChatService.DeliveredNotice(message.getChat().getId(), message.getId())
			);
		}
	}

	// presence isn't conversation content — unlike chat messages it's fine (and
	// necessary) to broadcast it to everyone connected, not just one recipient
	private void broadcast(String username, boolean online) {
		messagingTemplate.convertAndSend("/topic/presence", new PresenceEvent(username, online));
	}

	public record PresenceEvent(String username, boolean online) {
	}

}
