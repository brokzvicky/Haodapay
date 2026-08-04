package com.haodaone.user.repository;

import com.haodaone.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    @Query("""
        SELECT DISTINCT u
        FROM User u
        LEFT JOIN FETCH u.roles r
        LEFT JOIN FETCH r.permissions
        WHERE u.username = :username
          AND u.deleted = false
        """)
    Optional<User> findByUsernameAndDeletedFalse(@Param("username") String username);

    Optional<User> findByEmailAndDeletedFalse(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    java.util.List<User> findAllByDeletedFalse();
}