package br.com.jarvis.repository;
import br.com.jarvis.domain.Area;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface AreaRepository extends JpaRepository<Area,Long> {
 List<Area> findByUserIdOrderByIdDesc(Long userId);
 Optional<Area> findByIdAndUserId(Long id,Long userId);
}
