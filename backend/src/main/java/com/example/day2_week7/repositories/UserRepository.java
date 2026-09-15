package com.example.day2_week7.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.day2_week7.entities.User;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByUsername(String username);

	Optional<User> findByUsernameOrEmail(String username, String email);

	boolean existsByUsernameOrEmail(String username, String email);

	// newest-first, capped at 5: ids are assigned sequentially at registration,
	// so ordering by id desc doubles as "most recently registered" with no
	// extra createdAt column needed
	List<User> findTop5ByIdNotOrderByIdDesc(Long id);

}
