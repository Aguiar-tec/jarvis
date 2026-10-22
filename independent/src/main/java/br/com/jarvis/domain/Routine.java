package br.com.jarvis.domain;
import jakarta.persistence.*;
@Entity @Table(name="routines")
public class Routine extends OwnedEntity {

 @Column(nullable=false,length=150) public String name;
 @Column(columnDefinition="text") public String description;
}
