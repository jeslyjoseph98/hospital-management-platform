package com.hms.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtService {

    private final Key key;
    private final long expirationSeconds;

    public JwtService(@Value("${hms.jwt.secret}") String secret,
                       @Value("${hms.jwt.expiration-seconds}") long expirationSeconds) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationSeconds = expirationSeconds;
    }

    public String generateToken(Long patientId, String name, String patientCode) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(patientId))
                .claim("name", name)
                .claim("patientCode", patientCode)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirationSeconds)))
                .signWith(key)
                .compact();
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    public AuthenticatedPatient parseToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith((javax.crypto.SecretKey) key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            Long patientId = Long.valueOf(claims.getSubject());
            String name = claims.get("name", String.class);
            String patientCode = claims.get("patientCode", String.class);
            return new AuthenticatedPatient(patientId, name, patientCode);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new JwtException("Invalid or expired token", ex);
        }
    }
}
