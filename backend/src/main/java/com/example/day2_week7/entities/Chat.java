package com.example.day2_week7.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ponytail: 1:1 chats only, matching NewChatModal (start-by-single-username, no group UI).
@Entity
@Table(name = "chats")
@Getter
@Setter
@NoArgsConstructor
public class Chat {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "user1_id", nullable = false)
	private User user1;

	@ManyToOne(optional = false)
	@JoinColumn(name = "user2_id", nullable = false)
	private User user2;

}
