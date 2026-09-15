package com.example.day2_week7.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.day2_week7.entities.Chat;
import com.example.day2_week7.entities.Message;
import com.example.day2_week7.entities.MessageStatus;
import com.example.day2_week7.entities.User;

public interface MessageRepository extends JpaRepository<Message, Long> {

	Optional<Message> findTopByChatOrderBySentAtDesc(Chat chat);

	long countByChatAndSenderNotAndStatusNot(Chat chat, User sender, MessageStatus status);

	List<Message> findByChatOrderByIdDesc(Chat chat, Pageable pageable);

	List<Message> findByChatAndIdLessThanOrderByIdDesc(Chat chat, Long beforeId, Pageable pageable);

	// returns how many rows actually flipped, so the caller can skip notifying
	// the sender when there was nothing new to mark as read
	@Modifying
	@Query("update Message m set m.status = :readStatus where m.chat = :chat and m.sender <> :me and m.status <> :readStatus")
	int markRead(@Param("chat") Chat chat, @Param("me") User me, @Param("readStatus") MessageStatus readStatus);

	// Chat has no cascade-delete mapping to Message, so this has to run before
	// deleting the chat row itself or the FK constraint would reject it
	void deleteByChat(Chat chat);

	// across every chat "me" is part of, messages someone else sent that never
	// got a delivery ack — used to flush the backlog the moment "me" reconnects,
	// instead of waiting for them to happen to open that specific chat
	@Query("select m from Message m where m.status = :status and m.sender <> :me and (m.chat.user1 = :me or m.chat.user2 = :me)")
	List<Message> findPendingFor(@Param("status") MessageStatus status, @Param("me") User me);

}
