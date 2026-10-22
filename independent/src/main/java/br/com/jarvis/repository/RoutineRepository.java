package br.com.jarvis.repository;
import br.com.jarvis.domain.Routine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface RoutineRepository extends JpaRepository<Routine,Long> {
 List<Routine> findByUserIdOrderByIdDesc(Long userId);
 Optional<Routine> findByIdAndUserId(Long id,Long userId);
}
