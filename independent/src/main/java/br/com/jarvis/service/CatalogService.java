package br.com.jarvis.service;
import br.com.jarvis.api.*;
import br.com.jarvis.domain.*;
import br.com.jarvis.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @Transactional
public class CatalogService {
 private final AreaRepository areas;
 private final CompetencyRepository competencies;
 private final RoutineRepository routines;
 private final GoalRepository goals;
 public CatalogService(AreaRepository areas,CompetencyRepository competencies,RoutineRepository routines,GoalRepository goals) {
 this.areas=areas;
 this.competencies=competencies;
 this.routines=routines;
 this.goals=goals;
 }

 @Transactional(readOnly=true) public List<Map<String,Object>> areas(Long owner) {
  return areas.findByUserIdOrderByIdDesc(owner).stream().map(Views::area).toList();
 }
 public Map<String,Object> saveArea(Long owner,Long id,Requests.Category input) {
  Area row=id==null?new Area():areas.findByIdAndUserId(id,owner).orElseThrow(ApiException::notFound);
  if(id!=null) Versions.check(row,input.version());
  row.userId=owner;row.name=input.name().trim();
  return Views.area(areas.saveAndFlush(row));
 }
 public void deleteArea(Long owner,Long id,Long version) {
  Area row=areas.findByIdAndUserId(id,owner).orElseThrow(ApiException::notFound);
  Versions.check(row,version);areas.delete(row);areas.flush();
 }

 @Transactional(readOnly=true) public List<Map<String,Object>> competencies(Long owner) {
  return competencies.findByUserIdOrderByIdDesc(owner).stream().map(Views::competency).toList();
 }
 public Map<String,Object> saveCompetency(Long owner,Long id,Requests.Category input) {
  Competency row=id==null?new Competency():competencies.findByIdAndUserId(id,owner).orElseThrow(ApiException::notFound);
  if(id!=null) Versions.check(row,input.version());
  row.userId=owner;row.name=input.name().trim();
  return Views.competency(competencies.saveAndFlush(row));
 }
 public void deleteCompetency(Long owner,Long id,Long version) {
  Competency row=competencies.findByIdAndUserId(id,owner).orElseThrow(ApiException::notFound);
  Versions.check(row,version);competencies.delete(row);competencies.flush();
 }

 @Transactional(readOnly=true) public List<Map<String,Object>> routines(Long owner) {
  return routines.findByUserIdOrderByIdDesc(owner).stream().map(Views::routine).toList();
 }
 public Map<String,Object> saveRoutine(Long owner,Long id,Requests.Routine input) {
  Routine row=id==null?new Routine():routines.findByIdAndUserId(id,owner).orElseThrow(ApiException::notFound);
  if(id!=null) Versions.check(row,input.version());
  row.userId=owner;row.name=input.name().trim();row.description=input.description();
  return Views.routine(routines.saveAndFlush(row));
 }
 public void deleteRoutine(Long owner,Long id,Long version) {
  Routine row=routines.findByIdAndUserId(id,owner).orElseThrow(ApiException::notFound);
  Versions.check(row,version);routines.delete(row);routines.flush();
 }

 @Transactional(readOnly=true) public List<Map<String,Object>> goals(Long owner) {
  return goals.findByUserIdOrderByIdDesc(owner).stream().map(Views::goal).toList();
 }
 public Map<String,Object> saveGoal(Long owner,Long id,Requests.Goal input) {
  Goal row=id==null?new Goal():goals.findByIdAndUserId(id,owner).orElseThrow(ApiException::notFound);
  if(id!=null) Versions.check(row,input.version());
  row.userId=owner;if(input.endDate().isBefore(input.startDate())) throw ApiException.invalid("O fim do período deve ser igual ou posterior ao início.");
 row.title=input.title().trim();row.description=input.description();row.startDate=input.startDate();row.endDate=input.endDate();
  return Views.goal(goals.saveAndFlush(row));
 }
 public void deleteGoal(Long owner,Long id,Long version) {
  Goal row=goals.findByIdAndUserId(id,owner).orElseThrow(ApiException::notFound);
  Versions.check(row,version);goals.delete(row);goals.flush();
 }
}
