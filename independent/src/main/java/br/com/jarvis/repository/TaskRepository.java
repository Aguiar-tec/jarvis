package br.com.jarvis.repository;
import br.com.jarvis.domain.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface TaskRepository extends JpaRepository<Task,Long> {
 List<Task> findByUserIdOrderByIdDesc(Long userId);
 Optional<Task> findByIdAndUserId(Long id,Long userId);
}
