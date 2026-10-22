package br.com.jarvis;
import br.com.jarvis.api.*;
import br.com.jarvis.domain.Account;
import br.com.jarvis.repository.AccountRepository;
import br.com.jarvis.service.AccountService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
class AccountServiceTest {
 @Test void rejectsMismatchedConfirmationBeforeWriting() {
  var repository=mock(AccountRepository.class);var encoder=mock(PasswordEncoder.class);
  var service=new AccountService(repository,encoder);
  assertThatThrownBy(()->service.register(new Requests.Registration("Daniel","d@example.test","password123","different"))).isInstanceOf(ApiException.class);
  verifyNoInteractions(repository,encoder);
 }
 @Test void rejectsUtf8PasswordBeyondBcryptLimit() {
  var repository=mock(AccountRepository.class);var encoder=mock(PasswordEncoder.class);
  String password="á".repeat(37);
  assertThatThrownBy(()->new AccountService(repository,encoder).register(new Requests.Registration("Daniel","d@example.test",password,password))).isInstanceOf(ApiException.class);
  verifyNoInteractions(repository,encoder);
 }
 @Test void normalizesEmailAndNeverReturnsPasswordHash() {
  var repository=mock(AccountRepository.class);var encoder=mock(PasswordEncoder.class);
  when(encoder.encode("password123")).thenReturn("encoded-secret");
  when(repository.saveAndFlush(any(Account.class))).thenAnswer(invocation->{Account a=invocation.getArgument(0);a.id=1L;return a;});
  var result=new AccountService(repository,encoder).register(new Requests.Registration(" Daniel ","D@EXAMPLE.TEST","password123","password123"));
  assertThat(result).containsEntry("email","d@example.test").containsEntry("name","Daniel").doesNotContainKeys("password","passwordHash","confirmation");
  verify(repository).existsByEmail("d@example.test");
 }
}
