package com.cardapio.poli.security.auth;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String senha;
}