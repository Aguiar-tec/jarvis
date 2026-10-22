package br.com.jarvis.domain;
import jakarta.persistence.*;
@Entity @Table(name="areas")
public class Area extends OwnedEntity {
@Column(nullable=false,length=100) public String name;
}
