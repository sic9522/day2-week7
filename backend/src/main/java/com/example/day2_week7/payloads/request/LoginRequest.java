package com.example.day2_week7.payloads.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {

	@NotBlank(message = "Campo obbligatorio")
	private String identifier;

	@NotBlank(message = "Campo obbligatorio")
	private String password;

}
