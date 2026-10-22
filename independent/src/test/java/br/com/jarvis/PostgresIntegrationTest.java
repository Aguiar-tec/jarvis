package br.com.jarvis;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import javax.sql.DataSource;
import java.sql.*;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc
@EnabledIfEnvironmentVariable(named="JARVIS_TEST_DB",matches="true")
class PostgresIntegrationTest {
 @Autowired MockMvc mvc; @Autowired ObjectMapper json; @Autowired JdbcTemplate jdbc;
 @Autowired DataSource dataSource; @Autowired PasswordEncoder passwords;
 private record Client(MockHttpSession session,String email) {}
 private Client client() throws Exception {
  String email="test-"+UUID.randomUUID()+"@example.test";
  mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
   .content(json.writeValueAsString(Map.of("name","Daniel","email",email,"password","password123","confirmation","password123")))).andExpect(status().isCreated());
  var login=mvc.perform(post("/api/auth/login").with(csrf()).param("email",email).param("password","password123")).andExpect(status().isNoContent()).andReturn();
  return new Client((MockHttpSession)login.getRequest().getSession(false),email);
 }
 private JsonNode send(Client c,MockHttpServletRequestBuilder request,Object body,int status) throws Exception {
  request.session(c.session()).with(csrf());
  if(body!=null) request.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
  String response=mvc.perform(request).andExpect(status().is(status)).andReturn().getResponse().getContentAsString();
  return response.isEmpty()?json.nullNode():json.readTree(response);
 }
 private JsonNode category(Client c,String kind) throws Exception { return send(c,post("/api/"+kind),Map.of("name","Estudo"),201); }
 private ObjectNode taskInput(JsonNode area,JsonNode competency) {
  ObjectNode n=json.createObjectNode();n.put("title","Estudar Java");n.put("taskDate","2026-10-22");n.put("priority","alta");
  n.put("areaId",area.path("id").asText());n.putArray("competencyIds").add(competency.path("id").asText());return n;
 }
 private JsonNode task(Client c) throws Exception { return send(c,post("/api/tasks"),taskInput(category(c,"areas"),category(c,"competencies")),201); }
 private String id(JsonNode n) { return n.path("id").asText(); }
 @Test void realCsrfLoginHashAndLogout() throws Exception {
  var initial=mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
  var session=(MockHttpSession)initial.getRequest().getSession(false);var token=json.readTree(initial.getResponse().getContentAsString());
  String email="csrf-"+UUID.randomUUID()+"@example.test";
  var registration=Map.of("name","Daniel","email",email.toUpperCase(Locale.ROOT),"password","password123","confirmation","password123");
  mvc.perform(post("/api/auth/register").session(session).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(registration))).andExpect(status().isForbidden());
  mvc.perform(post("/api/auth/register").session(session).header(token.path("headerName").asText(),token.path("token").asText())
   .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(registration))).andExpect(status().isCreated()).andExpect(jsonPath("passwordHash").doesNotExist());
  String hash=jdbc.queryForObject("SELECT password_hash FROM users WHERE email=?",String.class,email);
  assertThat(hash).isNotEqualTo("password123");assertThat(passwords.matches("password123",hash)).isTrue();
  mvc.perform(post("/api/auth/login").session(session).header(token.path("headerName").asText(),token.path("token").asText())
   .param("email",email).param("password","password123")).andExpect(status().isNoContent());
  mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk()).andExpect(jsonPath("email").value(email));
  mvc.perform(post("/api/auth/logout").session(session).with(csrf())).andExpect(status().isNoContent());
  assertThat(session.isInvalid()).isTrue();mvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
 }
 @Test void rejectsWrongPasswordDuplicateEmailAndUnknownOwner() throws Exception {
  Client c=client();
  mvc.perform(post("/api/auth/login").with(csrf()).param("email",c.email()).param("password","incorrect")).andExpect(status().isUnauthorized());
  mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(
   Map.of("name","Other","email",c.email().toUpperCase(Locale.ROOT),"password","password123","confirmation","password123")))).andExpect(status().isConflict());
  send(c,post("/api/areas"),Map.of("name","Area","userId","999"),400);
 }
 @Test void crudMultipleCompetenciesAndCompletion() throws Exception {
  Client c=client();var area=category(c,"areas");var first=category(c,"competencies");var second=category(c,"competencies");
  var input=taskInput(area,first);input.withArray("competencyIds").add(id(second));
  var t=send(c,post("/api/tasks"),input,201);assertThat(t.path("competencyIds").size()).isEqualTo(2);
  var completed=send(c,patch("/api/tasks/"+id(t)+"/completion"),Map.of("completed",true,"version",t.path("version").asText()),200);
  assertThat(completed.path("completed").asBoolean()).isTrue();assertThat(completed.path("completedAt").isNull()).isFalse();
  var reopened=send(c,patch("/api/tasks/"+id(t)+"/completion"),Map.of("completed",false,"version",completed.path("version").asText()),200);
  assertThat(reopened.path("completedAt").isNull()).isTrue();
  input.put("version",reopened.path("version").asText());input.putArray("competencyIds").add(id(second));input.put("title","Revisar Java");
  var updated=send(c,put("/api/tasks/"+id(t)),input,200);assertThat(updated.path("competencyIds").size()).isEqualTo(1);
  send(c,delete("/api/tasks/"+id(t)).param("version",updated.path("version").asText()),null,204);
  assertThat(jdbc.queryForObject("SELECT count(*) FROM task_competencies WHERE task_id=?",Long.class,Long.valueOf(id(t)))).isZero();
 }
 @Test void preventsCrossUserReadsWritesAndAllForeignLinks() throws Exception {
  Client a=client(),b=client();var task=task(a);var ownArea=category(b,"areas");var ownCompetency=category(b,"competencies");
  send(b,get("/api/tasks/"+id(task)),null,404);
  send(b,delete("/api/tasks/"+id(task)).param("version",task.path("version").asText()),null,404);
  send(b,patch("/api/tasks/"+id(task)+"/completion"),Map.of("completed",true,"version",task.path("version").asText()),404);
  send(b,put("/api/tasks/"+id(task)),taskInput(ownArea,ownCompetency),404);
  assertThat(send(b,get("/api/tasks"),null,200).size()).isZero();
  var foreignArea=category(a,"areas");var foreignCompetency=category(a,"competencies");
  send(b,post("/api/tasks"),taskInput(foreignArea,ownCompetency),404);
  send(b,post("/api/tasks"),taskInput(ownArea,foreignCompetency),404);
  for(String kind:List.of("areas","competencies","routines","goals")) {
   Object body=kind.equals("goals")?Map.of("title","Meta","startDate","2026-10-01","endDate","2026-10-31"):Map.of("name","Registro");
   var foreign=send(a,post("/api/"+kind),body,201);
   send(b,put("/api/"+kind+"/"+id(foreign)),body,404);
   send(b,delete("/api/"+kind+"/"+id(foreign)).param("version","0"),null,404);
   if(kind.equals("routines")||kind.equals("goals")) {
    var input=taskInput(ownArea,ownCompetency);input.put(kind.equals("routines")?"routineId":"goalId",id(foreign));
    send(b,post("/api/tasks"),input,404);
   }
  }
 }
 @Test void validatesEmptyDuplicateCompetenciesAndGoalPeriod() throws Exception {
  Client c=client();var area=category(c,"areas");var competency=category(c,"competencies");var input=taskInput(area,competency);
  input.putArray("competencyIds");send(c,post("/api/tasks"),input,400);
  input.withArray("competencyIds").add(id(competency)).add(id(competency));send(c,post("/api/tasks"),input,400);
  send(c,post("/api/goals"),Map.of("title","Meta","startDate","2026-10-31","endDate","2026-10-01"),400);
  send(c,post("/api/areas"),Map.of("name","  "),400);
 }
 @Test void rejectsStaleUpdatesAndDeletionOfReferencedRecords() throws Exception {
  Client c=client();var area=category(c,"areas");var competency=category(c,"competencies");var input=taskInput(area,competency);
  var routine=send(c,post("/api/routines"),Map.of("name","Manhã"),201);
  var goal=send(c,post("/api/goals"),Map.of("title","Aprender","startDate","2026-10-01","endDate","2026-10-31"),201);
  input.put("routineId",id(routine));input.put("goalId",id(goal));var t=send(c,post("/api/tasks"),input,201);
  for(var entry:Map.of("areas",area,"competencies",competency,"routines",routine,"goals",goal).entrySet())
   send(c,delete("/api/"+entry.getKey()+"/"+id(entry.getValue())).param("version","0"),null,409);
  input.put("version",t.path("version").asText());input.put("title","Atualizada");send(c,put("/api/tasks/"+id(t)),input,200);
  send(c,put("/api/tasks/"+id(t)),input,409);
  send(c,delete("/api/tasks/"+id(t)).param("version",t.path("version").asText()),null,409);
 }
 @Test void databaseRejectsCrossOwnerAndMissingCompetencyAtCommit() throws Exception {
  Client a=client(),b=client();var area=category(a,"areas");var foreign=category(b,"areas");
  long owner=jdbc.queryForObject("SELECT id FROM users WHERE email=?",Long.class,a.email());
  try(Connection connection=dataSource.getConnection()) {
   connection.setAutoCommit(false);
   try(var stmt=connection.prepareStatement("INSERT INTO tasks(user_id,area_id,title,task_date,priority) VALUES (?,?,'Direct',CURRENT_DATE,'test')")) {
    stmt.setLong(1,owner);stmt.setLong(2,Long.parseLong(id(foreign)));
    assertThatThrownBy(stmt::executeUpdate).isInstanceOf(SQLException.class);connection.rollback();
    stmt.setLong(2,Long.parseLong(id(area)));stmt.executeUpdate();
    assertThatThrownBy(connection::commit).isInstanceOf(SQLException.class).extracting(e->((SQLException)e).getSQLState()).isEqualTo("23514");connection.rollback();
   }
  }
 }
 @Test void databaseBlocksRemovingLastCompetencyAndInvalidCompletion() throws Exception {
  Client c=client();var t=task(c);long taskId=Long.parseLong(id(t));
  try(Connection connection=dataSource.getConnection()) {
   connection.setAutoCommit(false);
   try(var stmt=connection.prepareStatement("DELETE FROM task_competencies WHERE task_id=?")) {
    stmt.setLong(1,taskId);stmt.executeUpdate();assertThatThrownBy(connection::commit).isInstanceOf(SQLException.class);connection.rollback();
   }
  }
  assertThatThrownBy(()->jdbc.update("UPDATE tasks SET completed=true,completed_at=NULL WHERE id=?",taskId)).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
 }
 @Test void concurrentRemovalCannotLeaveTaskWithoutCompetencies() throws Exception {
  Client c=client();var area=category(c,"areas");var x=category(c,"competencies");var y=category(c,"competencies");
  var input=taskInput(area,x);input.withArray("competencyIds").add(id(y));var t=send(c,post("/api/tasks"),input,201);
  try(Connection first=dataSource.getConnection();Connection second=dataSource.getConnection()) {
   first.setAutoCommit(false);second.setAutoCommit(false);
   try(var s=first.prepareStatement("DELETE FROM task_competencies WHERE task_id=? AND competency_id=?")) {
    s.setLong(1,Long.parseLong(id(t)));s.setLong(2,Long.parseLong(id(x)));s.executeUpdate();
   }
   ExecutorService executor=Executors.newSingleThreadExecutor();CountDownLatch started=new CountDownLatch(1);
   try {
    Future<String> result=executor.submit(()->{
     try(var s=second.prepareStatement("DELETE FROM task_competencies WHERE task_id=? AND competency_id=?")) {
      s.setQueryTimeout(10);s.setLong(1,Long.parseLong(id(t)));s.setLong(2,Long.parseLong(id(y)));started.countDown();s.executeUpdate();second.commit();return "committed";
     } catch(SQLException error) { second.rollback();return error.getSQLState(); }
    });
    assertThat(started.await(5,TimeUnit.SECONDS)).isTrue();first.commit();
    assertThat(result.get(15,TimeUnit.SECONDS)).isEqualTo("23514");
   } finally { executor.shutdownNow(); }
  }
  assertThat(jdbc.queryForObject("SELECT count(*) FROM task_competencies WHERE task_id=?",Long.class,Long.parseLong(id(t)))).isEqualTo(1);
 }
 @Test void servesUiWithSecurityHeadersAndRequiresCsrf() throws Exception {
  mvc.perform(get("/")).andExpect(status().isOk()).andExpect(header().string("X-Content-Type-Options","nosniff"))
   .andExpect(header().string("Content-Security-Policy",org.hamcrest.Matchers.containsString("frame-ancestors 'none'")));
  Client c=client();mvc.perform(post("/api/areas").session(c.session()).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Area\"}")).andExpect(status().isForbidden());
 }
}
