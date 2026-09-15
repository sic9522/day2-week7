package com.example.day2_week7.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.day2_week7.entities.Chat;
import com.example.day2_week7.entities.User;

public interface ChatRepository extends JpaRepository<Chat, Long> {

	List<Chat> findByUser1OrUser2(User user1, User user2);

	@Query("select c from Chat c where (c.user1 = :a and c.user2 = :b) or (c.user1 = :b and c.user2 = :a)")
	Optional<Chat> findBetween(@Param("a") User a, @Param("b") User b);

}
