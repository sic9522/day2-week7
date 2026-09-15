package com.example.day2_week7.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.example.day2_week7.security.StompAuthInterceptor;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	private final StompAuthInterceptor stompAuthInterceptor;

	public WebSocketConfig(StompAuthInterceptor stompAuthInterceptor) {
		this.stompAuthInterceptor = stompAuthInterceptor;
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		// /queue backs per-user destinations — chat messages/typing/read receipts
		// go to the one recipient (convertAndSendToUser), never a shared topic.
		// /topic is only for presence: online/offline isn't conversation content,
		// so it's fine (and needed) for everyone connected to see it.
		registry.enableSimpleBroker("/queue", "/topic");
		registry.setApplicationDestinationPrefixes("/app");
		registry.setUserDestinationPrefix("/user");
	}

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/ws")
			.setAllowedOriginPatterns("http://localhost:5173")
			.withSockJS();
	}

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(stompAuthInterceptor);
	}

}
