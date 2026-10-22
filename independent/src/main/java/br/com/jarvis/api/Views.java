package br.com.jarvis.api;
import br.com.jarvis.domain.*;
import java.util.*;
public final class Views {
 private Views() {}
 public static Map<String,Object> base(BaseEntity e) {
  Map<String,Object> out=new LinkedHashMap<>();out.put("id",e.id.toString());out.put("version",e.version.toString());
  out.put("createdAt",e.createdAt);out.put("updatedAt",e.updatedAt);return out;
 }
 public static Map<String,Object> account(Account a) { return Map.of("id",a.id.toString(),"name",a.name,"email",a.email); }
 public static Map<String,Object> area(Area a) { var o=base(a);o.put("name",a.name);return o; }
 public static Map<String,Object> competency(Competency a) { var o=base(a);o.put("name",a.name);return o; }
 public static Map<String,Object> routine(Routine a) { var o=base(a);o.put("name",a.name);o.put("description",a.description);return o; }
 public static Map<String,Object> goal(Goal a) { var o=base(a);o.put("title",a.title);o.put("description",a.description);o.put("startDate",a.startDate);o.put("endDate",a.endDate);return o; }
 public static Map<String,Object> task(Task a,List<Long> ids) {
  var o=base(a);o.put("title",a.title);o.put("description",a.description);o.put("taskDate",a.taskDate);o.put("taskTime",a.taskTime);
  o.put("priority",a.priority);o.put("completed",a.completed);o.put("completedAt",a.completedAt);
  o.put("areaId",a.areaId.toString());o.put("routineId",a.routineId==null?null:a.routineId.toString());o.put("goalId",a.goalId==null?null:a.goalId.toString());
  o.put("competencyIds",ids.stream().map(Object::toString).toList());return o;
 }
}
