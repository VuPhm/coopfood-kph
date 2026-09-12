package vn.coopfood.kph.identity;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.filter.OncePerRequestFilter;

public class PrincipalRefreshFilter extends OncePerRequestFilter {

    private final IdentityService identityService;
    private final SecurityContextRepository securityContextRepository;

    public PrincipalRefreshFilter(
            IdentityService identityService,
            SecurityContextRepository securityContextRepository) {
        this.identityService = identityService;
        this.securityContextRepository = securityContextRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        Authentication current = SecurityContextHolder.getContext().getAuthentication();
        if (current != null && current.getPrincipal() instanceof SessionPrincipal existing) {
            identityService.refresh(existing.userId()).ifPresentOrElse(refreshed -> {
                Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
                        refreshed,
                        null,
                        refreshed.authorities());
                SecurityContext context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(authentication);
                SecurityContextHolder.setContext(context);
                securityContextRepository.saveContext(context, request, response);
            }, () -> {
                SecurityContext context = SecurityContextHolder.createEmptyContext();
                SecurityContextHolder.setContext(context);
                if (request.getSession(false) != null) {
                    request.getSession(false).invalidate();
                }
            });
        }
        filterChain.doFilter(request, response);
    }
}
