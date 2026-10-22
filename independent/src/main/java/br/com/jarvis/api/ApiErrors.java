package br.com.jarvis.api;
import org.springframework.dao.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.util.Map;
@RestControllerAdvice
public class ApiErrors {
 private ResponseEntity<Map<String,String>> error(int status,String message) { return ResponseEntity.status(status).body(Map.of("error",message)); }
 @ExceptionHandler(ApiException.class) ResponseEntity<?> domain(ApiException e) { return error(e.status,e.getMessage()); }
 @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<?> validation(MethodArgumentNotValidException e) {
  var field=e.getBindingResult().getFieldError();
  return error(400,field==null?"Dados inválidos.":"Verifique o campo: "+field.getField()+".");
 }
 @ExceptionHandler({HttpMessageNotReadableException.class,MethodArgumentTypeMismatchException.class})
 ResponseEntity<?> malformed(Exception e) { return error(400,"Dados inválidos. Verifique os campos enviados."); }
 @ExceptionHandler(OptimisticLockingFailureException.class) ResponseEntity<?> stale(Exception e) { return error(409,"O registro foi alterado. Atualize antes de tentar novamente."); }
 @ExceptionHandler(DataIntegrityViolationException.class) ResponseEntity<?> constraint(Exception e) { return error(409,"A operação conflita com registros existentes. Desvincule as tarefas antes de excluir uma área, competência, rotina ou meta."); }
 @ExceptionHandler(DataAccessException.class) ResponseEntity<?> unavailable(Exception e) { return error(503,"Não foi possível acessar os registros. Tente novamente."); }
}
