package com.example.day2_week7.services;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.day2_week7.entities.User;
import com.example.day2_week7.exceptions.UnauthorizedException;
import com.example.day2_week7.repositories.UserRepository;

@Service
public class CurrentUserService {

	private final UserRepository userRepository;

	public CurrentUserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	public User get(Authentication authentication) {
		return get(authentication.getName());
	}

	public User get(String username) {
		return userRepository.findByUsername(username)
			.orElseThrow(() -> new UnauthorizedException("Utente non trovato"));
	}

}
