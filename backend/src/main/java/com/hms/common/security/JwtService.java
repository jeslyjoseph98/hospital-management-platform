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

    /**
     * LOG-R3: sub = user id, role, name, patientId/patientCode only if role = PATIENT,
     * doctorId only if role = DOCTOR.
     */
    public String generateToken(Long userId, String role, String name, Long patientId, String patientCode, Long doctorId) {
        Instant now = Instant.now();
        var builder = Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role)
                .claim("name", name)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirationSeconds)));
        if (patientId != null) {
            builder.claim("patientId", patientId).claim("patientCode", patientCode);
        }
        if (doctorId != null) {
            builder.claim("doctorId", doctorId);
        }
        return builder.signWith(key).compact();
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    public AuthenticatedUser parseToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith((javax.crypto.SecretKey) key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            Long userId = Long.valueOf(claims.getSubject());
            String role = claims.get("role", String.class);
            String name = claims.get("name", String.class);
            // Numeric claims round-trip through JSON as Integer when small, so widen via Number
            // rather than requesting Long.class directly (which throws on an Integer value).
            Number patientIdClaim = claims.get("patientId", Number.class);
            Long patientId = patientIdClaim == null ? null : patientIdClaim.longValue();
            String patientCode = claims.get("patientCode", String.class);
            Number doctorIdClaim = claims.get("doctorId", Number.class);
            Long doctorId = doctorIdClaim == null ? null : doctorIdClaim.longValue();
            return new AuthenticatedUser(userId, role, name, patientId, patientCode, doctorId);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new JwtException("Invalid or expired token", ex);
        }
    }
}
