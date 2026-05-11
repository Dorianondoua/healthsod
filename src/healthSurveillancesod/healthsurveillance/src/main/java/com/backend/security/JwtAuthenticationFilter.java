package com.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        System.out.println("[JWT] Requête sur " + request.getMethod() + " " + request.getRequestURI());
        System.out.println("[JWT] Authorization header: " + header);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            System.out.println("[JWT] Token extrait: " + token);
            try {
                Claims claims = Jwts.parser()
                        .setSigningKey(jwtSecret)
                        .parseClaimsJws(token)
                        .getBody();
                String email = claims.getSubject();
                String role = (String) claims.get("role");
                System.out.println("[JWT] Claims: email=" + email + ", role=" + role);
                if (email != null && role != null) {
                    System.out.println("JWT Filter: email=" + email + ", role=" + role);
                    // Spring attend "ROLE_PATIENT" et pas juste "PATIENT"
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            email, null, Collections.singletonList(authority));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {
                System.out.println("[JWT] Exception lors du parsing du token: " + e.getMessage());
                // Token invalide, on ignore et on laisse la requête échouer plus loin
            }
        }
        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        // Exclure seulement /api/medecins (sans slash) du filtre JWT
        // Les endpoints /api/medecins/** doivent être protégés
        return path.equals("/api/medecins");
    }
} 