'use client';
import { useState } from 'react';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Choice } from './ui';
import { COLORS,DAY_NAMES,uid,materializeRoutines,workspaceSchema,type Workspace,type Kind } from '@/lib/jarvis';
export type EditorTarget={kind:Kind;id?:string};
const labels={task:'tarefa',routine:'rotina',goal:'meta',area:'área',competency:'competência'};
export default function Editor({target,data,today,onClose,onSave,busy}:{target:EditorTarget;data:Workspace;today:string;onClose:()=>void;onSave:(data:Workspace)=>Promise<boolean>;busy:boolean}){
 const list=target.kind==='task'?data.tasks:target.kind==='routine'?data.routines:target.kind==='goal'?data.goals:target.kind==='area'?data.areas:data.competencies;
 const original=list.find(x=>x.id===target.id);
 const [form,setForm]=useState(()=>({title:original&&'title'in original?original.title:original&&'name'in original?original.name:'',description:original&&'description'in original?original.description:'',due:original&&'due'in original?original.due:today,time:original&&'time'in original?original.time:'',areaId:original&&'areaId'in original?original.areaId||'none':'none',competencyIds:original&&'competencyIds'in original?[...original.competencyIds]:[] as string[],goalId:original&&'goalId'in original?original.goalId||'none':'none',priority:original&&'priority'in original&&typeof original.priority==='string'?original.priority:'medium',start:original&&'start'in original?original.start:today,end:original&&'end'in original?original.end||'':'',days:original&&'days'in original?[...original.days]:[1,2,3,4,5],color:original&&'color'in original&&typeof original.color==='string'?original.color:COLORS[0]}));
 const [error,setError]=useState('');
 const field=(k:keyof typeof form,v:unknown)=>setForm(f=>({...f,[k]:v}));
 const isCategory=target.kind==='area'||target.kind==='competency';
 const links={areaId:form.areaId==='none'?null:form.areaId,competencyIds:form.competencyIds,goalId:form.goalId==='none'?null:form.goalId};
 async function submit(e:React.FormEvent){
  e.preventDefault();setError('');const d=structuredClone(data),id=target.id||uid(), common={id,title:form.title.trim(),description:form.description};
  const upsert=<T extends {id:string}>(items:T[],item:T)=>{const i=items.findIndex(x=>x.id===id);if(i<0)items.push(item);else items[i]=item;};
  if(target.kind==='task'){
   const old=d.tasks.find(t=>t.id===id);
   upsert(d.tasks,{...common,...links,due:form.due,time:form.time,priority:form.priority as 'low'|'medium'|'high',done:old?.done||false,completedAt:old?.completedAt||null,createdAt:old?.createdAt||today,routineId:old?.routineId||null,occurrence:old?.occurrence||null});
  }
  if(target.kind==='routine'){
   const old=d.routines.find(r=>r.id===id);
   upsert(d.routines,{...common,...links,time:form.time,start:form.start,end:form.end||null,days:[...form.days].sort(),active:old?.active??true,lastGenerated:old?.lastGenerated||null});
  }
  if(target.kind==='goal'){const old=d.goals.find(g=>g.id===id);upsert(d.goals,{...common,due:form.due,areaId:links.areaId,done:old?.done||false});}
  if(isCategory){const items=target.kind==='area'?d.areas:d.competencies;if(items.some(x=>x.id!==id&&x.name.toLocaleLowerCase()===form.title.trim().toLocaleLowerCase())){setError('Já existe um cadastro com este nome.');return;}upsert(items,{id,name:form.title.trim(),color:form.color});}
  const valid=workspaceSchema.safeParse(d);if(!valid.success){setError(valid.error.issues[0].message);return;}
  if(await onSave(materializeRoutines(valid.data,today)))onClose();
 }
 return <Dialog open onOpenChange={v=>{if(!v&&!busy)onClose();}}><DialogContent className="editor-dialog"><DialogHeader><DialogTitle>{target.id?'Editar':'Criar'} {labels[target.kind]}</DialogTitle><DialogDescription>{isCategory?'Organize suas atividades do seu jeito.':target.kind==='routine'?'A rotina gera uma tarefa independente em cada dia escolhido.':'Defina o que você quer realizar e acompanhe seu progresso.'}</DialogDescription></DialogHeader>
 <form onSubmit={submit} className="editor-form"><label>Nome<Input autoFocus value={form.title} onChange={e=>field('title',e.target.value)} maxLength={160} required placeholder={target.kind==='task'?'Ex.: estudar por 30 minutos':target.kind==='goal'?'Ex.: concluir o projeto de curso':target.kind==='routine'?'Ex.: leitura da manhã':'Ex.: organização'}/></label>
 {!isCategory&&<><label>Descrição <span className="optional">opcional</span><Textarea value={form.description} maxLength={2000} onChange={e=>field('description',e.target.value)} placeholder="Acrescente detalhes que ajudem na execução." rows={2}/></label>
 <div className="form-row">{target.kind!=='routine'?<label>Prazo<Input type="date" required value={form.due} onChange={e=>field('due',e.target.value)}/></label>:<label>Início<Input type="date" required value={form.start} onChange={e=>field('start',e.target.value)}/></label>}{target.kind==='goal'?null:<label>Horário <span className="optional">opcional</span><Input type="time" value={form.time} onChange={e=>field('time',e.target.value)}/></label>}</div>
 {target.kind==='routine'&&<><fieldset><legend>Repetir nos dias</legend><div className="day-picker">{DAY_NAMES.map((day,i)=><label key={day} className={form.days.includes(i)?'selected':''}><Checkbox checked={form.days.includes(i)} onCheckedChange={v=>field('days',v?[...form.days,i]:form.days.filter(x=>x!==i))} aria-label={day}/>{day}</label>)}</div></fieldset><label>Fim da rotina <span className="optional">opcional</span><Input type="date" min={form.start} value={form.end} onChange={e=>field('end',e.target.value)}/></label>{target.id&&<p className="help">Alterações valem para as próximas ocorrências. As tarefas já geradas preservam seu histórico.</p>}</>}
 <div className="form-row"><label>Área<Choice label="Área" value={form.areaId} onChange={v=>field('areaId',v)} options={[{value:'none',label:'Sem área'},...data.areas.map(a=>({value:a.id,label:a.name}))]}/></label>{target.kind==='task'&&<label>Prioridade<Choice label="Prioridade" value={form.priority} onChange={v=>field('priority',v)} options={[{value:'low',label:'Baixa'},{value:'medium',label:'Média'},{value:'high',label:'Alta'}]}/></label>}</div>
 {target.kind!=='goal'&&<><label>Meta vinculada<Choice label="Meta vinculada" value={form.goalId} onChange={v=>field('goalId',v)} options={[{value:'none',label:'Sem meta'},...data.goals.map(g=>({value:g.id,label:g.title}))]}/></label><fieldset><legend>Competências <span className="optional">selecione uma ou mais</span></legend><div className="competency-picker">{data.competencies.map(c=><label key={c.id}><Checkbox checked={form.competencyIds.includes(c.id)} onCheckedChange={v=>field('competencyIds',v?[...form.competencyIds,c.id]:form.competencyIds.filter(x=>x!==c.id))}/><span>{c.name}</span></label>)}</div>{!data.competencies.length&&<p className="help">Cadastre competências no menu Áreas e competências.</p>}</fieldset></>}
 </>}
 {isCategory&&<label>Cor de identificação<Input type="color" value={form.color} onChange={e=>field('color',e.target.value)} className="color-input"/></label>}
 {error&&<p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button variant="ghost" type="button" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" disabled={busy}>{busy?'Salvando…':'Salvar '+labels[target.kind]}</Button></div>
 </form></DialogContent></Dialog>;
}
