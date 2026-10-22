package br.com.jarvis.domain;
import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
@Embeddable
public class TaskCompetencyId implements Serializable {
 @Column(name="task_id") public Long taskId;
 @Column(name="competency_id") public Long competencyId;
 public TaskCompetencyId() {}
 public TaskCompetencyId(Long taskId,Long competencyId) { this.taskId=taskId;this.competencyId=competencyId; }
 @Override public boolean equals(Object o) { return o instanceof TaskCompetencyId x && Objects.equals(taskId,x.taskId)&&Objects.equals(competencyId,x.competencyId); }
 @Override public int hashCode() { return Objects.hash(taskId,competencyId); }
}
