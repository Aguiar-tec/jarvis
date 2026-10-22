package br.com.jarvis.security;
import br.com.jarvis.repository.AccountRepository;
import br.com.jarvis.service.AccountService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.savedrequest.NullRequestCache;
@Configuration
public class SecurityConfig {
 @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
 @Bean UserDetailsService users(AccountRepository repository) {
  return email->repository.findByEmail(AccountService.normalizeEmail(email))
   .map(a->User.withUsername(a.email).password(a.passwordHash).roles("USER").build())
   .orElseThrow(()->new UsernameNotFoundException("Credenciais inválidas."));
 }
 @Bean SecurityFilterChain security(HttpSecurity http) throws Exception {
  http.authorizeHttpRequests(auth->auth
   .requestMatchers(HttpMethod.GET,"/","/index.html","/styles.css","/app.js","/favicon.svg","/api/auth/csrf").permitAll()
   .requestMatchers(HttpMethod.POST,"/api/auth/register","/api/auth/login").permitAll()
   .requestMatchers("/api/**").authenticated().anyRequest().denyAll());
  http.requestCache(cache->cache.requestCache(new NullRequestCache()));
  // CSRF is deliberately enabled for authenticated writes, registration and login.
  http.formLogin(login->login.loginProcessingUrl("/api/auth/login").usernameParameter("email")
   .successHandler((request,response,authentication)->response.setStatus(204))
   .failureHandler((request,response,error)->json(response,401,"E-mail ou senha inválidos.")));
  http.logout(logout->logout.logoutUrl("/api/auth/logout").deleteCookies("JARVIS_SESSION")
   .logoutSuccessHandler((request,response,authentication)->response.setStatus(204)));
  http.exceptionHandling(errors->errors
   .authenticationEntryPoint((request,response,error)->json(response,401,"Entre na sua conta para continuar."))
   .accessDeniedHandler((request,response,error)->json(response,403,"Solicitação não autorizada. Atualize a página e tente novamente.")));
  http.headers(headers->headers.contentSecurityPolicy(csp->csp.policyDirectives(
   "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'")));
  http.addFilterBefore(new RequestLimits(),UsernamePasswordAuthenticationFilter.class);
  return http.build();
 }
 static void json(HttpServletResponse response,int status,String message) throws java.io.IOException {
  response.setStatus(status);response.setContentType("application/json;charset=UTF-8");
  response.getWriter().write("{\"error\":\""+message+"\"}");
 }
}
