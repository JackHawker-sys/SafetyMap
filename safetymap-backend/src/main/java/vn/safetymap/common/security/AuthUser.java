package vn.safetymap.common.security;

import java.util.List;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import vn.safetymap.user.entity.UserRole;

public record AuthUser(Integer id, Set<UserRole> roles) {

    // Spring Security uses the prefix ROLE_ -> hasRole("ADMIN") matches
    // "ROLE_ADMIN"
    public List<GrantedAuthority> authorities() {
        return roles.stream()
                .map(r -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + r.name()))
                .toList();
    }
}