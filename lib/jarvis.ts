import { z } from 'zod';

const id = z.string().min(1).max(100);
const title = z.string().trim().min(1, 'Informe um nome.').max(160);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s, 'Data inválida.');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const category = z.object({id, name:title, color:z.string().regex(/^#[0-9a-fA-F]{6}$/)});
const links = {areaId:id.nullable(), competencyIds:z.array(id).max(100), goalId:id.nullable()};
const task = z.object({id,title,description:z.string().max(2000),due:date,time:time.or(z.literal('')),done:z.boolean(),completedAt:date.nullable(),createdAt:date,priority:z.enum(['low','medium','high']),...links,routineId:id.nullable(),occurrence:date.nullable()});
const routine = z.object({id,title,description:z.string().max(2000),start:date,end:date.nullable(),time:time.or(z.literal('')),days:z.array(z.number().int().min(0).max(6)).min(1).max(7),active:z.boolean(),...links,lastGenerated:date.nullable()});
const goal = z.object({id,title,description:z.string().max(2000),due:date,done:z.boolean(),areaId:id.nullable()});
export const workspaceSchema = z.object({
  tasks:z.array(task).max(10000), routines:z.array(routine).max(300), goals:z.array(goal).max(500),
  areas:z.array(category).max(100), competencies:z.array(category).max(100),
  deletedOccurrences:z.array(z.string().max(150)).max(10000),
  settings:z.object({name:z.string().trim().min(1).max(80),theme:z.enum(['cyan','blue','amber']),motion:z.boolean(),audio:z.boolean()}),
  demo:z.boolean(),
}).superRefine((d,ctx)=>{
  const fail=(message:string)=>ctx.addIssue({code:'custom',message});
  for(const list of [d.tasks,d.routines,d.goals,d.areas,d.competencies]) if(new Set(list.map(x=>x.id)).size!==list.length) fail('Identificadores duplicados.');
  const areas=new Set(d.areas.map(x=>x.id)), comps=new Set(d.competencies.map(x=>x.id)), goals=new Set(d.goals.map(x=>x.id)), routines=new Set(d.routines.map(x=>x.id));
  for(const x of [...d.tasks,...d.routines,...d.goals]) if(x.areaId&&!areas.has(x.areaId))fail('Área inexistente.');
  for(const x of [...d.tasks,...d.routines]) {
    if(x.competencyIds.some(c=>!comps.has(c))||new Set(x.competencyIds).size!==x.competencyIds.length) fail('Competências inválidas.');
    if(x.goalId&&!goals.has(x.goalId))fail('Meta inexistente.');
  }
  for(const x of d.tasks){if(x.routineId&&!routines.has(x.routineId))fail('Rotina inexistente.');if(x.done!==!!x.completedAt)fail('Conclusão inconsistente.');}
  for(const x of d.routines){if(x.end&&x.end<x.start)fail('O fim da rotina deve ser posterior ao início.');if(new Set(x.days).size!==x.days.length)fail('Dias duplicados.');}
});
export type Workspace=z.infer<typeof workspaceSchema>;
export type Task=Workspace['tasks'][number];
export type Routine=Workspace['routines'][number];
export type Goal=Workspace['goals'][number];
export type Category=Workspace['areas'][number];
export type Kind='task'|'routine'|'goal'|'area'|'competency';
export const COLORS=['#55dcf7','#a7a0ff','#65dbc0','#eab477','#e78bab','#8cb8ff'];
export const DAY_NAMES=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
export const uid=()=>crypto.randomUUID();
export function dateKey(d=new Date()):string{return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function addDays(s:string,n:number):string {const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return dateKey(d);}
export function formatDate(s:string,opts?:Intl.DateTimeFormatOptions){return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',opts??{day:'2-digit',month:'short'});}
export function emptyWorkspace(name='Daniel'):Workspace{return {tasks:[],routines:[],goals:[],areas:[{id:'estudos',name:'Estudos',color:COLORS[0]},{id:'saude',name:'Saúde',color:COLORS[2]},{id:'pessoal',name:'Pessoal',color:COLORS[1]}],competencies:[{id:'disciplina',name:'Disciplina',color:COLORS[0]},{id:'foco',name:'Foco',color:COLORS[1]},{id:'estudo',name:'Estudo',color:COLORS[3]}],deletedOccurrences:[],settings:{name,theme:'cyan',motion:true,audio:false},demo:false};}
export function percentage(tasks:Pick<Task,'done'>[]){return tasks.length?Math.round(tasks.filter(t=>t.done).length/tasks.length*100):0;}
export function periodTasks(d:Workspace,from:string,to:string){return d.tasks.filter(t=>t.due>=from&&t.due<=to);}
export function weekDays(today:string){return Array.from({length:7},(_,i)=>addDays(today,i-6));}
export function streak(d:Workspace,today:string){const dates=new Set(d.tasks.filter(t=>t.done).map(t=>t.completedAt));let cursor=dates.has(today)?today:addDays(today,-1),count=0;while(dates.has(cursor)&&count<10000){count++;cursor=addDays(cursor,-1);}return count;}
// Daily occurrences use deterministic IDs. Missed dates remain open; completion
// can never be copied from one occurrence into the next. Deleted ones stay deleted.
export function materializeRoutines(state:Workspace,today:string):Workspace {
  const d=structuredClone(state), existing=new Set(d.tasks.map(t=>t.id)), deleted=new Set(d.deletedOccurrences);
  for(const r of d.routines){
    if(!r.active||r.start>today)continue;
    let day=r.lastGenerated?addDays(r.lastGenerated,1):r.start;
    const end=r.end&&r.end<today?r.end:today;
    for(;day<=end&&d.tasks.length<10000;day=addDays(day,1)){
      const taskId=`${r.id}:${day}`;
      if(r.days.includes(new Date(day+'T12:00:00').getDay())&&!existing.has(taskId)&&!deleted.has(taskId)){
        d.tasks.push({id:taskId,title:r.title,description:r.description,due:day,time:r.time,done:false,completedAt:null,createdAt:day,priority:'medium',areaId:r.areaId,competencyIds:[...r.competencyIds],goalId:r.goalId,routineId:r.id,occurrence:day});existing.add(taskId);
      }
      r.lastGenerated=day;
    }
  }
  return d;
}
export function removeEntity(state:Workspace,kind:Kind,id:string):Workspace{
 const d=structuredClone(state);
 if(kind==='task'){const t=d.tasks.find(t=>t.id===id);if(t?.routineId)d.deletedOccurrences.push(t.id);d.tasks=d.tasks.filter(t=>t.id!==id);}
 if(kind==='routine'){d.routines=d.routines.filter(r=>r.id!==id);d.tasks=d.tasks.map(t=>t.routineId===id?{...t,routineId:null}:t);}
 if(kind==='goal'){d.goals=d.goals.filter(g=>g.id!==id);for(const x of [...d.tasks,...d.routines])if(x.goalId===id)x.goalId=null;}
 if(kind==='area'){d.areas=d.areas.filter(a=>a.id!==id);for(const x of [...d.tasks,...d.routines,...d.goals])if(x.areaId===id)x.areaId=null;}
 if(kind==='competency'){d.competencies=d.competencies.filter(c=>c.id!==id);for(const x of [...d.tasks,...d.routines])x.competencyIds=x.competencyIds.filter(c=>c!==id);}
 return d;
}
export function achievements(d:Workspace,today:string){
 const complete=d.tasks.filter(t=>t.done).length, seq=streak(d,today);
 return [
 {id:'first',title:'Primeiro passo',description:'Conclua sua primeira tarefa.',current:complete,target:1,icon:'spark'},
 {id:'ten',title:'Em movimento',description:'Conclua 10 tarefas.',current:complete,target:10,icon:'zap'},
 {id:'three',title:'Ritmo constante',description:'Conclua tarefas em 3 dias seguidos.',current:seq,target:3,icon:'flame'},
 {id:'seven',title:'Uma semana de foco',description:'Conclua tarefas em 7 dias seguidos.',current:seq,target:7,icon:'target'},
 {id:'goal',title:'Objetivo alcançado',description:'Marque uma meta como concluída.',current:d.goals.filter(g=>g.done).length,target:1,icon:'flag'},
 {id:'fifty',title:'Construindo o futuro',description:'Conclua 50 tarefas.',current:complete,target:50,icon:'trophy'},
 ];
}
export function demoWorkspace(name:string,today:string):Workspace{
 const d=emptyWorkspace(name);d.demo=true;
 d.goals=[{id:'demo-goal',title:'Concluir o projeto de curso',description:'Finalizar e apresentar o assistente de rotina.',due:addDays(today,14),done:false,areaId:'estudos'}];
 const titles=['Revisar os objetivos do projeto','Planejar a semana','Estudar por 30 minutos','Organizar o material de estudo','Revisar a introdução do trabalho','Praticar os exercícios','Revisar as tarefas anteriores','Documentar o progresso','Finalizar o relatório','Preparar a apresentação'];
 d.tasks=titles.map((title,i)=>({id:uid(),title,description:'Registro de demonstração para verificar o cálculo de desempenho.',due:today,time:`${String(i+8).padStart(2,'0')}:00`,done:i<8,completedAt:i<8?today:null,createdAt:today,priority:i>=8?'high':'medium',areaId:'estudos',competencyIds:['disciplina',i%2?'foco':'estudo'],goalId:'demo-goal',routineId:null,occurrence:null}));
 return d;
}
export const CATALOG=[
 ['Plano Gratuito','Acesso básico a tarefas diárias e até 3 competências',0,'Plano'],
 ['Plano Premium Mensal','Acesso ilimitado a relatórios e competências',29.9,'Plano'],
 ['Plano Premium Anual','Desconto promocional com pagamento único anual',289,'Plano'],
 ['Análise Avançada de Produtividade com IA','Módulo adicional',14.9,'Módulo'],
 ['Backup Automático em Nuvem Privada','Módulo adicional',9.9,'Módulo'],
 ['Pacote de Personalização Visual','Temas e Interface Estilo Sci-Fi',19.9,'Pacote'],
 ['Pacote de Sons e Respostas em Áudio Personalizadas','Respostas personalizadas',14.9,'Pacote'],
 ['Licença Estudantil','Acesso Premium com desconto para alunos',14.9,'Licença'],
 ['Licença Coletiva / Empresa','Acesso corporativo até 10 usuários',199.9,'Licença'],
 ['Integração com Google Calendar e Microsoft Outlook','Módulo de integração',12.9,'Módulo'],
 ['Consultoria Individual de Organização de Rotina','Sessão de 1h online',150,'Serviço'],
 ['Relatório Trimestral PDF Consolidado','Com Análise Profissional',39.9,'Serviço'],
 ['Suporte Técnico Prioritário 24/7','Assinatura mensal',19.9,'Serviço'],
 ['Gamificação Avançada','Sistema de Conquistas e Troféus',9.9,'Módulo'],
 ['Treinamento Onboarding Corporativo','Para Gestão de Equipes',350,'Serviço'],
 ['API de Integração para Desenvolvedores','Acesso a dados próprios',49.9,'Módulo'],
 ['Pacote de Metodologias Prontas','OKRs, Matriz de Eisenhower, Pomodoro',24.9,'Pacote'],
 ['Restauração e Recuperação Avançada de Dados','Serviço de recuperação',80,'Serviço'],
 ['Gestão Financeira Pessoal Atrelada a Metas','Módulo de gestão financeira',19.9,'Módulo'],
 ['Licença Vitalícia para Usuário Final','Acesso ilimitado permanente',899,'Licença'],
] as const;
