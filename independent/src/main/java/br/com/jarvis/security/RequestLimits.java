package br.com.jarvis.security;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
/** Bounded single-process limiter. A public deployment also needs an edge limiter. */
final class RequestLimits extends OncePerRequestFilter {
 private record Window(long start,int attempts) {}
 private final Map<String,Window> windows=new LinkedHashMap<>();
 private synchronized boolean allow(String key) {
  long now=System.currentTimeMillis();
  windows.entrySet().removeIf(e->now-e.getValue().start()>60_000);
  Window w=windows.get(key);
  if(w==null) { if(windows.size()>=4096) return false;windows.put(key,new Window(now,1));return true; }
  if(w.attempts()>=60) return false;
  windows.put(key,new Window(w.start(),w.attempts()+1));return true;
 }
 @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
  String path=request.getServletPath();
  if(path.startsWith("/api/")) response.setHeader("Cache-Control","no-store");
  if(request.getMethod().equals("POST")&&(path.equals("/api/auth/login")||path.equals("/api/auth/register"))&&!allow(request.getRemoteAddr())) {
   response.setHeader("Retry-After","60");SecurityConfig.json(response,429,"Muitas tentativas. Aguarde um minuto.");return;
  }
  if(path.startsWith("/api/")&&request.getContentType()!=null&&request.getContentType().startsWith("application/json")) {
   byte[] bytes=request.getInputStream().readNBytes(65_537);
   if(bytes.length>65_536) { SecurityConfig.json(response,413,"Solicitação muito grande.");return; }
   request=new HttpServletRequestWrapper(request) {
    @Override public ServletInputStream getInputStream() {
     var input=new ByteArrayInputStream(bytes);
     return new ServletInputStream() {
      @Override public int read() { return input.read(); }
      @Override public boolean isFinished() { return input.available()==0; }
      @Override public boolean isReady() { return true; }
      @Override public void setReadListener(ReadListener listener) { throw new UnsupportedOperationException(); }
     };
    }
    @Override public BufferedReader getReader() { return new BufferedReader(new InputStreamReader(getInputStream(),StandardCharsets.UTF_8)); }
   };
  }
  chain.doFilter(request,response);
 }
}
