package br.com.jarvis.service;
import br.com.jarvis.api.*;
import br.com.jarvis.domain.*;
import br.com.jarvis.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
@Service @Transactional
public class TaskService {
 private final TaskRepository tasks;private final TaskCompetencyRepository links;
 private final AreaRepository areas;private final CompetencyRepository competencies;
 private final RoutineRepository routines;private final GoalRepository goals;
 public TaskService(TaskRepository tasks,TaskCompetencyRepository links,AreaRepository areas,CompetencyRepository competencies,RoutineRepository routines,GoalRepository goals) {
  this.tasks=tasks;this.links=links;this.areas=areas;this.competencies=competencies;this.routines=routines;this.goals=goals;
 }
 @Transactional(readOnly=true) public List<Map<String,Object>> list(Long owner) {
  var byTask=links.findByUserId(owner).stream().collect(Collectors.groupingBy(x->x.id.taskId,Collectors.mapping(x->x.id.competencyId,Collectors.toList())));
  return tasks.findByUserIdOrderByIdDesc(owner).stream().map(t->Views.task(t,byTask.getOrDefault(t.id,List.of()))).toList();
 }
 @Transactional(readOnly=true) public Map<String,Object> get(Long owner,Long id) { return view(owned(owner,id)); }
 public Map<String,Object> save(Long owner,Long id,Requests.Task input) {
  Task row=id==null?new Task():owned(owner,id);
  if(id!=null) Versions.check(row,input.version());
  areas.findByIdAndUserId(input.areaId(),owner).orElseThrow(ApiException::notFound);
  if(input.routineId()!=null) routines.findByIdAndUserId(input.routineId(),owner).orElseThrow(ApiException::notFound);
  if(input.goalId()!=null) goals.findByIdAndUserId(input.goalId(),owner).orElseThrow(ApiException::notFound);
  Set<Long> requested=new LinkedHashSet<>(input.competencyIds());
  if(requested.isEmpty()||requested.size()!=input.competencyIds().size()) throw ApiException.invalid("Selecione uma ou mais competências, sem repetir.");
  for(Long competency:requested) competencies.findByIdAndUserId(competency,owner).orElseThrow(ApiException::notFound);
  row.userId=owner;row.title=input.title().trim();row.description=input.description();
  row.taskDate=input.taskDate();row.taskTime=input.taskTime();row.priority=input.priority().trim();
  row.areaId=input.areaId();row.routineId=input.routineId();row.goalId=input.goalId();
  // Increment the parent's version even when only its competency set changes.
  row.updatedAt=Instant.now();tasks.saveAndFlush(row);
  var existing=links.findByIdTaskIdAndUserId(row.id,owner);
  Set<Long> present=existing.stream().map(x->x.id.competencyId).collect(Collectors.toSet());
  for(var link:existing) if(!requested.contains(link.id.competencyId)) links.delete(link);
  for(Long competency:requested) if(!present.contains(competency)) links.save(new TaskCompetency(row.id,competency,owner));
  links.flush();return Views.task(row,new ArrayList<>(requested));
 }
 public Map<String,Object> complete(Long owner,Long id,Requests.Completion input) {
  Task row=owned(owner,id);Versions.check(row,input.version());
  if(row.completed!=input.completed()) { row.completed=input.completed();row.completedAt=row.completed?Instant.now():null; }
  tasks.saveAndFlush(row);return view(row);
 }
 public void delete(Long owner,Long id,Long version) { Task row=owned(owner,id);Versions.check(row,version);tasks.delete(row);tasks.flush(); }
 private Task owned(Long owner,Long id) { return tasks.findByIdAndUserId(id,owner).orElseThrow(ApiException::notFound); }
 private Map<String,Object> view(Task row) { return Views.task(row,links.findByIdTaskIdAndUserId(row.id,row.userId).stream().map(x->x.id.competencyId).toList()); }
}
