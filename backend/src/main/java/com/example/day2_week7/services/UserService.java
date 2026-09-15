package com.example.day2_week7.services;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.day2_week7.entities.User;
import com.example.day2_week7.exceptions.BadRequestException;
import com.example.day2_week7.exceptions.UnauthorizedException;
import com.example.day2_week7.payloads.request.LoginRequest;
import com.example.day2_week7.payloads.request.RegisterRequest;
import com.example.day2_week7.payloads.response.AuthResponse;
import com.example.day2_week7.payloads.response.UserResponse;
import com.example.day2_week7.payloads.response.UserSummaryResponse;
import com.example.day2_week7.repositories.UserRepository;
import com.example.day2_week7.security.JwtService;

@Service
public class UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final PresenceService presenceService;

	public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
			PresenceService presenceService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.presenceService = presenceService;
	}

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		if (userRepository.existsByUsernameOrEmail(request.getUsername(), request.getEmail())) {
			throw new BadRequestException("Username o email già in uso");
		}

		User user = new User();
		user.setNome(request.getNome());
		user.setCognome(request.getCognome());
		user.setUsername(request.getUsername());
		user.setEmail(request.getEmail());
		user.setPassword(passwordEncoder.encode(request.getPassword()));
		userRepository.save(user);

		return new AuthResponse(jwtService.generateToken(user.getUsername()), user);
	}

	public AuthResponse login(LoginRequest request) {
		User user = userRepository.findByUsernameOrEmail(request.getIdentifier(), request.getIdentifier())
			.orElseThrow(() -> new UnauthorizedException("Credenziali non valide"));

		if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
			throw new UnauthorizedException("Credenziali non valide");
		}

		return new AuthResponse(jwtService.generateToken(user.getUsername()), user);
	}

	@Transactional
	public UserResponse toggleReadReceipts(User user) {
		user.setReadReceipts(!user.isReadReceipts());
		userRepository.save(user);
		return new UserResponse(user);
	}

	public List<UserSummaryResponse> listOthers(User me) {
		return userRepository.findTop5ByIdNotOrderByIdDesc(me.getId()).stream()
			.map(u -> new UserSummaryResponse(u, presenceService.isOnline(u.getUsername())))
			.toList();
	}

}
