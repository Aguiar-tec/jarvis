package br.com.jarvis.domain;
import jakarta.persistence.*;
@MappedSuperclass
public abstract class OwnedEntity extends BaseEntity {
 @Column(name="user_id",nullable=false,updatable=false) public Long userId;
}
