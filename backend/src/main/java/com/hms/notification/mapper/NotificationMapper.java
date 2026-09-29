package com.hms.notification.mapper;

import com.hms.notification.model.Notification;
import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NotificationMapper {

    void insert(Notification notification);

    List<Notification> findByPatient(@Param("patientId") Long patientId,
                                      @Param("unreadOnly") boolean unreadOnly,
                                      @Param("offset") int offset,
                                      @Param("limit") int limit);

    long countByPatient(@Param("patientId") Long patientId, @Param("unreadOnly") boolean unreadOnly);

    int countUnread(@Param("patientId") Long patientId);

    Optional<Notification> findByIdAndPatient(@Param("id") Long id, @Param("patientId") Long patientId);

    void markRead(@Param("id") Long id);
}
