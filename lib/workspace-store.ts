import { env } from 'cloudflare:workers';
import { emptyWorkspace, type Workspace } from './jarvis';

function database(){if(!env.DB)throw new Error('Database binding unavailable');return env.DB;}
export async function readWorkspace(userId:string,name:string){
 const row=await database().prepare('SELECT data, version FROM jarvis_workspaces WHERE user_id = ?').bind(userId).first<{data:string;version:number}>();
 return row?{data:JSON.parse(row.data) as Workspace,version:row.version}:{data:emptyWorkspace(name),version:0};
}
export async function writeWorkspace(userId:string,data:Workspace,version:number){
 const db=database(), json=JSON.stringify(data),now=new Date().toISOString();
 const result=version===0
 ?await db.prepare('INSERT INTO jarvis_workspaces (user_id,data,version,updated_at) VALUES (?,?,1,?) ON CONFLICT(user_id) DO NOTHING').bind(userId,json,now).run()
 :await db.prepare('UPDATE jarvis_workspaces SET data = ?, version = version + 1, updated_at = ? WHERE user_id = ? AND version = ?').bind(json,now,userId,version).run();
 return result.meta.changes===1;
}
