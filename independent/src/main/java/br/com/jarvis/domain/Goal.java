package br.com.jarvis.domain;
import jakarta.persistence.*;
@Entity @Table(name="goals")
public class Goal extends OwnedEntity {

 @Column(nullable=false,length=150) public String title;
 @Column(columnDefinition="text") public String description;
 @Column(name="start_date",nullable=false) public java.time.LocalDate startDate;
 @Column(name="end_date",nullable=false) public java.time.LocalDate endDate;
}
