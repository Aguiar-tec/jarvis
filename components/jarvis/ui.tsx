'use client';
import type { ReactNode } from 'react';
import { ArrowUpRight, Orbit, Plus } from 'lucide-react';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
import { Empty,EmptyHeader,EmptyTitle,EmptyDescription,EmptyContent } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
export function Choice({value,onChange,options,label,id}:{value:string;onChange:(v:string)=>void;options:{value:string;label:string}[];label:string;id?:string}){
 return <Select value={value||'none'} onValueChange={onChange}><SelectTrigger id={id} aria-label={label} className="choice"><SelectValue /></SelectTrigger><SelectContent>{options.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>;
}
export function Panel({title,eyebrow,children,action,className=''}:{title?:string;eyebrow?:string;children:ReactNode;action?:ReactNode;className?:string}){return <section className={`panel ${className}`}>{(title||eyebrow)&&<div className="panel-head"><div>{eyebrow&&<p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>{action}</div>}{children}</section>;}
export function Blank({title,text,onClick,button='Criar agora'}:{title:string;text:string;onClick?:()=>void;button?:string}){return <Empty className="blank"><EmptyHeader><div className="empty-symbol"><Orbit size={25}/></div><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{text}</EmptyDescription></EmptyHeader>{onClick&&<EmptyContent><Button variant="outline" onClick={onClick}><Plus size={16}/>{button}</Button></EmptyContent>}</Empty>;}
export function Gauge({value,total,done}:{value:number;total:number;done:number}){
 const c=2*Math.PI*103;
 return <div className="gauge" role="img" aria-label={`${value}% das tarefas de hoje concluídas. ${done} de ${total}.`}>
 <svg viewBox="0 0 300 300" aria-hidden="true">
 <defs><radialGradient id="core"><stop offset="0" stopColor="var(--primary)" stopOpacity=".09"/><stop offset="1" stopColor="var(--primary)" stopOpacity="0"/></radialGradient></defs>
 <circle cx="150" cy="150" r="143" fill="url(#core)"/>
 <circle className="outer-dial" cx="150" cy="150" r="140" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="70 12 7 12" opacity=".5"/>
 {Array.from({length:60},(_,i)=><line key={i} x1="150" y1={i%5===0?'18':'23'} x2="150" y2="29" transform={`rotate(${i*6} 150 150)`} stroke="currentColor" strokeWidth={i%5===0?2:1} opacity={i%5===0?.85:.35}/>)}
 <circle cx="150" cy="150" r="116" fill="none" stroke="currentColor" strokeWidth="1" opacity=".25"/>
 <circle cx="150" cy="150" r="103" fill="none" stroke="currentColor" strokeWidth="6" opacity=".12"/>
 <circle cx="150" cy="150" r="103" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray={`${value/100*c} ${c}`} strokeLinecap="round" transform="rotate(-90 150 150)"/>
 <circle cx="150" cy="150" r="90" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 8" opacity=".28"/>
 </svg>
 <div className="gauge-text"><span>PROGRESSO DIÁRIO</span><strong>{value}<small>%</small></strong><p>{done} de {total} concluídas</p><span className="gauge-tag">{total===0?'PRONTO PARA COMEÇAR':value===100?'MISSÃO CUMPRIDA':'EM EVOLUÇÃO'}</span></div>
 </div>;
}
export function SectionLink({children,onClick}:{children:ReactNode;onClick:()=>void}){return <button className="text-link" onClick={onClick}>{children}<ArrowUpRight size={15}/></button>;}
