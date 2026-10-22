package br.com.jarvis.api;
import br.com.jarvis.service.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/tasks")
public class TaskController {
 private final TaskService tasks;private final AccountService accounts;
 public TaskController(TaskService tasks,AccountService accounts) { this.tasks=tasks;this.accounts=accounts; }
 private Long owner(Authentication auth) { return accounts.current(auth).id; }
 @GetMapping public List<Map<String,Object>> list(Authentication auth) { return tasks.list(owner(auth)); }
 @GetMapping("/{id}") public Map<String,Object> get(Authentication auth,@PathVariable Long id) { return tasks.get(owner(auth),id); }
 @PostMapping @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> create(Authentication auth,@Valid @RequestBody Requests.Task input) { return tasks.save(owner(auth),null,input); }
 @PutMapping("/{id}") public Map<String,Object> update(Authentication auth,@PathVariable Long id,@Valid @RequestBody Requests.Task input) { return tasks.save(owner(auth),id,input); }
 @PatchMapping("/{id}/completion") public Map<String,Object> complete(Authentication auth,@PathVariable Long id,@Valid @RequestBody Requests.Completion input) { return tasks.complete(owner(auth),id,input); }
 @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(Authentication auth,@PathVariable Long id,@RequestParam Long version) { tasks.delete(owner(auth),id,version); }
}
