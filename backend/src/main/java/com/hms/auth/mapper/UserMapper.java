package com.hms.auth.mapper;

import com.hms.auth.model.User;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

    Optional<User> findByPhone(@Param("phone") String phone);

    Optional<User> findByEmail(@Param("email") String email);

    Optional<User> findById(@Param("id") Long id);

    void insert(User user);

    void updateLastLogin(@Param("id") Long id);
}
