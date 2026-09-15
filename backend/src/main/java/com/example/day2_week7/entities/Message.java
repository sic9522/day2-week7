package com.example.day2_week7.entities;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
public class Message {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "chat_id", nullable = false)
	private Chat chat;

	@ManyToOne(optional = false)
	@JoinColumn(name = "sender_id", nullable = false)
	private User sender;

	@Column(nullable = false, length = 2000)
	private String text;

	// an absolute point in time, not a wall-clock reading in some unstated
	// timezone — matches "istante assegnato dal server" from the spec
	@Column(nullable = false)
	private Instant sentAt = Instant.now();

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private MessageStatus status = MessageStatus.SENT;

}
