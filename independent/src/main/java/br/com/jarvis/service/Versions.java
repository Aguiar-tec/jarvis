package br.com.jarvis.service;
import br.com.jarvis.api.ApiException;
import br.com.jarvis.domain.BaseEntity;
import java.util.Objects;
final class Versions {
 private Versions() {}
 static void check(BaseEntity row,Long expected) {
  if(expected==null) throw ApiException.invalid("Informe a versão do registro.");
  if(!Objects.equals(row.version,expected)) throw ApiException.conflict("O registro foi alterado. Atualize antes de tentar novamente.");
 }
}
