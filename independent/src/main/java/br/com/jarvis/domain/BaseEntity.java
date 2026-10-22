package br.com.jarvis.domain;
import jakarta.persistence.*;
import java.time.Instant;
@MappedSuperclass
public abstract class BaseEntity {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 @Column(name="created_at",nullable=false,updatable=false) public Instant createdAt;
 @Column(name="updated_at",nullable=false) public Instant updatedAt;
 @Version @Column(nullable=false) public Long version;
 @PrePersist void created() { createdAt=Instant.now();updatedAt=createdAt; }
 @PreUpdate void updated() { updatedAt=Instant.now(); }
}
