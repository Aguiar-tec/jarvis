package br.com.jarvis.api;
public class ApiException extends RuntimeException {
 public final int status;
 public ApiException(int status,String message) { super(message);this.status=status; }
 public static ApiException notFound() { return new ApiException(404,"Registro não encontrado."); }
 public static ApiException invalid(String message) { return new ApiException(400,message); }
 public static ApiException conflict(String message) { return new ApiException(409,message); }
}
