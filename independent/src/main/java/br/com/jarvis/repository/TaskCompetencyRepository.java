package br.com.jarvis.repository;
import br.com.jarvis.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface TaskCompetencyRepository extends JpaRepository<TaskCompetency,TaskCompetencyId> {
 List<TaskCompetency> findByIdTaskIdAndUserId(Long taskId,Long userId);
 List<TaskCompetency> findByUserId(Long userId);
}
