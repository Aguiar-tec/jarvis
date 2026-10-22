package br.com.jarvis.domain;
import jakarta.persistence.*;
@Entity @Table(name="competencies")
public class Competency extends OwnedEntity {
@Column(nullable=false,length=100) public String name;
}
