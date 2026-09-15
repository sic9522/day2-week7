package com.example.day2_week7.services;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.day2_week7.entities.Chat;
import com.example.day2_week7.entities.Message;
import com.example.day2_week7.entities.MessageStatus;
import com.example.day2_week7.entities.User;
import com.example.day2_week7.exceptions.BadRequestException;
import com.example.day2_week7.exceptions.NotFoundException;
import com.example.day2_week7.payloads.response.ChatResponse;
import com.example.day2_week7.payloads.response.MessageResponse;
import com.example.day2_week7.repositories.ChatRepository;
import com.example.day2_week7.repositories.MessageRepository;
import com.example.day2_week7.repositories.UserRepository;

@Service
public class ChatService {

	private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.systemDefault());

	private final ChatRepository chatRepository;
	private final MessageRepository messageRepository;
	private final UserRepository userRepository;
	private final PresenceService presenceService;
	private final SimpMessagingTemplate messagingTemplate;

	public ChatService(ChatRepository chatRepository, MessageRepository messageRepository,
			UserRepository userRepository, PresenceService presenceService, SimpMessagingTemplate messagingTemplate) {
		this.chatRepository = chatRepository;
		this.messageRepository = messageRepository;
		this.userRepository = userRepository;
		this.presenceService = presenceService;
		this.messagingTemplate = messagingTemplate;
	}

	public List<ChatResponse> listChats(User me) {
		return chatRepository.findByUser1OrUser2(me, me).stream()
			.map(chat -> toResponse(chat, me))
			.toList();
	}

	@Transactional
	public ChatResponse startChat(User me, String username) {
		String trimmed = username == null ? "" : username.trim();
		if (trimmed.isEmpty()) throw new BadRequestException("Inserisci uno username");
		if (trimmed.equals(me.getUsername())) throw new BadRequestException("Non puoi scrivere a te stesso");

		User target = userRepository.findByUsername(trimmed)
			.orElseThrow(() -> new NotFoundException("Username non trovato"));

		Chat chat = chatRepository.findBetween(me, target)
			.orElseGet(() -> {
				Chat c = new Chat();
				c.setUser1(me);
				c.setUser2(target);
				return chatRepository.save(c);
			});

		return toResponse(chat, me);
	}

	public List<MessageResponse> getMessages(User me, Long chatId, Long beforeId, int size) {
		Chat chat = requireMembership(me, chatId);
		List<Message> page = beforeId == null
			? messageRepository.findByChatOrderByIdDesc(chat, PageRequest.of(0, size))
			: messageRepository.findByChatAndIdLessThanOrderByIdDesc(chat, beforeId, PageRequest.of(0, size));

		List<MessageResponse> result = page.stream()
			.map(m -> MessageResponse.from(m, me))
			.collect(Collectors.toCollection(java.util.ArrayList::new));
		Collections.reverse(result);
		return result;
	}

	// pushes a live read receipt to the original sender (the "blue ticks") only
	// when something actually flipped to read — opening an already-read chat
	// shouldn't ping the other side — and only when the reader (me) has read
	// receipts enabled: same as WhatsApp, disabling them stops you from telling
	// others you've read their messages (unread counts still update normally,
	// this only withholds the notice that reveals it)
	@Transactional
	public void markRead(User me, Long chatId) {
		Chat chat = requireMembership(me, chatId);
		int updated = messageRepository.markRead(chat, me, MessageStatus.READ);
		if (updated > 0 && me.isReadReceipts()) {
			User sender = otherOf(chat, me);
			messagingTemplate.convertAndSendToUser(sender.getUsername(), "/queue/read", new ReadNotice(chatId));
		}
	}

	// persists first (server-assigned id + instant, status=SENT), only then
	// delivers — and only to the recipient's own broker destination, never to
	// a shared/broadcast one. It stays SENT until the recipient's own client
	// acks it (see markDelivered) — no assumption that "connected" means "got it".
	@Transactional
	public void sendMessage(String senderUsername, Long chatId, String text) {
		User sender = userRepository.findByUsername(senderUsername)
			.orElseThrow(() -> new NotFoundException("Utente non trovato"));
		Chat chat = requireMembership(sender, chatId);

		Message message = new Message();
		message.setChat(chat);
		message.setSender(sender);
		message.setText(text);
		message.setSentAt(Instant.now());
		messageRepository.save(message);

		User recipient = otherOf(chat, sender);
		messagingTemplate.convertAndSendToUser(recipient.getUsername(), "/queue/messages", MessageResponse.from(message, sender));
	}

	// the recipient's client calls this the moment it actually receives a
	// message over the socket — a real delivery ack, not an inference from
	// presence. Only advances SENT -> DELIVERED: a message already READ (they
	// opened the chat before this ack arrived) must not regress.
	@Transactional
	public void markDelivered(String username, Long chatId, Long messageId) {
		User me = userRepository.findByUsername(username)
			.orElseThrow(() -> new NotFoundException("Utente non trovato"));
		Chat chat = requireMembership(me, chatId);

		Message message = messageRepository.findById(messageId)
			.orElseThrow(() -> new NotFoundException("Messaggio non trovato"));
		if (!message.getChat().getId().equals(chat.getId())) throw new NotFoundException("Messaggio non trovato");
		if (message.getSender().getId().equals(me.getId())) return;
		if (message.getStatus() != MessageStatus.SENT) return;

		message.setStatus(MessageStatus.DELIVERED);
		messageRepository.save(message);
		messagingTemplate.convertAndSendToUser(message.getSender().getUsername(), "/queue/delivered", new DeliveredNotice(chatId, messageId));
	}

	// deletes the whole conversation — for both participants, there's no
	// per-user "hide" concept here — messages first, or the FK on messages
	// would reject deleting the chat row
	@Transactional
	public void deleteChat(User me, Long chatId) {
		Chat chat = requireMembership(me, chatId);
		messageRepository.deleteByChat(chat);
		chatRepository.delete(chat);
	}

	public void notifyTyping(String senderUsername, Long chatId) {
		User sender = userRepository.findByUsername(senderUsername)
			.orElseThrow(() -> new NotFoundException("Utente non trovato"));
		Chat chat = requireMembership(sender, chatId);
		User recipient = otherOf(chat, sender);
		messagingTemplate.convertAndSendToUser(recipient.getUsername(), "/queue/typing", new TypingNotice(chatId));
	}

	private Chat requireMembership(User me, Long chatId) {
		Chat chat = chatRepository.findById(chatId)
			.orElseThrow(() -> new NotFoundException("Chat non trovata"));
		boolean member = chat.getUser1().getId().equals(me.getId()) || chat.getUser2().getId().equals(me.getId());
		if (!member) throw new NotFoundException("Chat non trovata");
		return chat;
	}

	private User otherOf(Chat chat, User me) {
		return chat.getUser1().getId().equals(me.getId()) ? chat.getUser2() : chat.getUser1();
	}

	private ChatResponse toResponse(Chat chat, User me) {
		User other = otherOf(chat, me);
		Message last = messageRepository.findTopByChatOrderBySentAtDesc(chat).orElse(null);
		long unread = messageRepository.countByChatAndSenderNotAndStatusNot(chat, me, MessageStatus.READ);
		boolean online = presenceService.isOnline(other.getUsername());

		return new ChatResponse(
			chat.getId(),
			other.getNome() + " " + other.getCognome(),
			other.getUsername(),
			last != null ? last.getText() : "",
			last != null ? TIME_FORMAT.format(last.getSentAt()) : "",
			unread,
			online
		);
	}

	public record TypingNotice(Long chatId) {
	}

	public record ReadNotice(Long chatId) {
	}

	public record DeliveredNotice(Long chatId, Long messageId) {
	}

}
