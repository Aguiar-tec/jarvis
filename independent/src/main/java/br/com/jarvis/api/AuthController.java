package br.com.jarvis.api;
import br.com.jarvis.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/auth")
public class AuthController {
 private final AccountService accounts;
 public AuthController(AccountService accounts) { this.accounts=accounts; }
 @GetMapping("/csrf") public Map<String,String> csrf(CsrfToken token) { return Map.of("headerName",token.getHeaderName(),"token",token.getToken()); }
 @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> register(@Valid @RequestBody Requests.Registration input) { return accounts.register(input); }
 @GetMapping("/me") public Map<String,Object> me(Authentication auth) { return Views.account(accounts.current(auth)); }
}
