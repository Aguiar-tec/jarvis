package br.com.jarvis.service;
import br.com.jarvis.api.*;
import br.com.jarvis.domain.Account;
import br.com.jarvis.repository.AccountRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.util.*;
@Service
public class AccountService {
 private final AccountRepository accounts;private final PasswordEncoder encoder;
 public AccountService(AccountRepository accounts,PasswordEncoder encoder) { this.accounts=accounts;this.encoder=encoder; }
 public static String normalizeEmail(String email) { return email.trim().toLowerCase(Locale.ROOT); }
 @Transactional public Map<String,Object> register(Requests.Registration input) {
  if(!input.password().equals(input.confirmation())) throw ApiException.invalid("A confirmação deve ser igual à senha.");
  if(input.password().getBytes(StandardCharsets.UTF_8).length>72) throw ApiException.invalid("A senha ultrapassa o limite de 72 bytes.");
  String email=normalizeEmail(input.email());
  if(accounts.existsByEmail(email)) throw ApiException.conflict("Não foi possível cadastrar essa conta. Confira o e-mail ou entre na conta existente.");
  Account row=new Account();row.name=input.name().trim();row.email=email;row.passwordHash=encoder.encode(input.password());
  return Views.account(accounts.saveAndFlush(row));
 }
 @Transactional(readOnly=true) public Account current(Authentication auth) {
  if(auth==null) throw new ApiException(401,"Entre na sua conta para continuar.");
  return accounts.findByEmail(auth.getName()).orElseThrow(()->new ApiException(401,"Entre na sua conta para continuar."));
 }
}
