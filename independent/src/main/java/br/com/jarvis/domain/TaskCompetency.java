package br.com.jarvis.domain;
import jakarta.persistence.*;
@Entity @Table(name="task_competencies")
public class TaskCompetency {
 @EmbeddedId public TaskCompetencyId id;
 @Column(name="user_id",nullable=false) public Long userId;
 public TaskCompetency() {}
 public TaskCompetency(Long taskId,Long competencyId,Long userId) { this.id=new TaskCompetencyId(taskId,competencyId);this.userId=userId; }
}
