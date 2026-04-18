package com.project.rbac.repository;

import com.project.rbac.entity.AuditLogArchive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogArchiveRepository extends JpaRepository<AuditLogArchive, Long> {
}
