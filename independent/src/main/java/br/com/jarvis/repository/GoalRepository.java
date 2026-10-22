package br.com.jarvis.repository;
import br.com.jarvis.domain.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface GoalRepository extends JpaRepository<Goal,Long> {
 List<Goal> findByUserIdOrderByIdDesc(Long userId);
 Optional<Goal> findByIdAndUserId(Long id,Long userId);
}
