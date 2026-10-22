package br.com.jarvis.repository;
import br.com.jarvis.domain.Competency;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface CompetencyRepository extends JpaRepository<Competency,Long> {
 List<Competency> findByUserIdOrderByIdDesc(Long userId);
 Optional<Competency> findByIdAndUserId(Long id,Long userId);
}
