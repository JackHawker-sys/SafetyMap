package vn.safetymap.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.safetymap.user.entity.User;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
