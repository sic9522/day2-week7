package com.example.day2_week7.payloads.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

	@NotBlank(message = "Campo obbligatorio")
	private String nome;

	@NotBlank(message = "Campo obbligatorio")
	private String cognome;

	@NotBlank(message = "Campo obbligatorio")
	@Pattern(regexp = "\\S+", message = "Niente spazi nello username")
	private String username;

	@NotBlank(message = "Campo obbligatorio")
	@Email(message = "Email non valida")
	private String email;

	@NotBlank(message = "Campo obbligatorio")
	@Size(min = 6, message = "Minimo 6 caratteri")
	private String password;

}
