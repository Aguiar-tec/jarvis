package br.com.jarvis.api;
import br.com.jarvis.service.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api")
public class CatalogController {
 private final CatalogService catalog;private final AccountService accounts;
 public CatalogController(CatalogService catalog,AccountService accounts) { this.catalog=catalog;this.accounts=accounts; }
 private Long owner(Authentication auth) { return accounts.current(auth).id; }

 @GetMapping("/areas") public List<Map<String,Object>> areas(Authentication auth) { return catalog.areas(owner(auth)); }
 @PostMapping("/areas") @ResponseStatus(HttpStatus.CREATED)
 public Map<String,Object> createArea(Authentication auth,@Valid @RequestBody Requests.Category input) { return catalog.saveArea(owner(auth),null,input); }
 @PutMapping("/areas/{id}") public Map<String,Object> updateArea(Authentication auth,@PathVariable Long id,@Valid @RequestBody Requests.Category input) { return catalog.saveArea(owner(auth),id,input); }
 @DeleteMapping("/areas/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
 public void deleteArea(Authentication auth,@PathVariable Long id,@RequestParam Long version) { catalog.deleteArea(owner(auth),id,version); }

 @GetMapping("/competencies") public List<Map<String,Object>> competencies(Authentication auth) { return catalog.competencies(owner(auth)); }
 @PostMapping("/competencies") @ResponseStatus(HttpStatus.CREATED)
 public Map<String,Object> createCompetency(Authentication auth,@Valid @RequestBody Requests.Category input) { return catalog.saveCompetency(owner(auth),null,input); }
 @PutMapping("/competencies/{id}") public Map<String,Object> updateCompetency(Authentication auth,@PathVariable Long id,@Valid @RequestBody Requests.Category input) { return catalog.saveCompetency(owner(auth),id,input); }
 @DeleteMapping("/competencies/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
 public void deleteCompetency(Authentication auth,@PathVariable Long id,@RequestParam Long version) { catalog.deleteCompetency(owner(auth),id,version); }

 @GetMapping("/routines") public List<Map<String,Object>> routines(Authentication auth) { return catalog.routines(owner(auth)); }
 @PostMapping("/routines") @ResponseStatus(HttpStatus.CREATED)
 public Map<String,Object> createRoutine(Authentication auth,@Valid @RequestBody Requests.Routine input) { return catalog.saveRoutine(owner(auth),null,input); }
 @PutMapping("/routines/{id}") public Map<String,Object> updateRoutine(Authentication auth,@PathVariable Long id,@Valid @RequestBody Requests.Routine input) { return catalog.saveRoutine(owner(auth),id,input); }
 @DeleteMapping("/routines/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
 public void deleteRoutine(Authentication auth,@PathVariable Long id,@RequestParam Long version) { catalog.deleteRoutine(owner(auth),id,version); }

 @GetMapping("/goals") public List<Map<String,Object>> goals(Authentication auth) { return catalog.goals(owner(auth)); }
 @PostMapping("/goals") @ResponseStatus(HttpStatus.CREATED)
 public Map<String,Object> createGoal(Authentication auth,@Valid @RequestBody Requests.Goal input) { return catalog.saveGoal(owner(auth),null,input); }
 @PutMapping("/goals/{id}") public Map<String,Object> updateGoal(Authentication auth,@PathVariable Long id,@Valid @RequestBody Requests.Goal input) { return catalog.saveGoal(owner(auth),id,input); }
 @DeleteMapping("/goals/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
 public void deleteGoal(Authentication auth,@PathVariable Long id,@RequestParam Long version) { catalog.deleteGoal(owner(auth),id,version); }
}
