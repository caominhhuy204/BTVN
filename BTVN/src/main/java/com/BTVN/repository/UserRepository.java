package com.BTVN.repository;

import com.BTVN.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUsername(String username);
    Optional<User> findByUsername(String username);
    Optional<User> findByAuthToken(String authToken);

    @Modifying
    @Query("update User u set u.authToken = null")
    void clearAllAuthTokens();
}
