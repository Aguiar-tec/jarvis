package br.com.jarvis.domain;
import jakarta.persistence.*;
@Entity @Table(name="tasks")
public class Task extends OwnedEntity {

 @Column(nullable=false,length=200) public String title;
 @Column(columnDefinition="text") public String description;
 @Column(name="task_date",nullable=false) public java.time.LocalDate taskDate;
 @Column(name="task_time") public java.time.LocalTime taskTime;
 @Column(nullable=false,length=30) public String priority;
 @Column(nullable=false) public boolean completed;
 @Column(name="completed_at") public java.time.Instant completedAt;
 @Column(name="area_id",nullable=false) public Long areaId;
 @Column(name="routine_id") public Long routineId;
 @Column(name="goal_id") public Long goalId;
}
