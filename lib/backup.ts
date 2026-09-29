import { workspaceSchema,type Workspace } from './jarvis.ts';
export const BACKUP_FILE_LIMIT=8_000_000;
export function parseBackup(text:string):Workspace{
 if(new TextEncoder().encode(text).length>BACKUP_FILE_LIMIT)throw new Error('O arquivo deve ter até 8 MB.');
 let value;try{value=JSON.parse(text);}catch{throw new Error('Escolha um arquivo JSON exportado pelo JARVIS.');}
 if(!value||value.application!=='JARVIS'||(value.schemaVersion!==undefined&&value.schemaVersion!==1))throw new Error('Este arquivo não é uma exportação compatível do JARVIS.');
 const result=workspaceSchema.safeParse(value.data);
 if(!result.success)throw new Error('A exportação contém dados inválidos: '+result.error.issues[0].message);
 if(new TextEncoder().encode(JSON.stringify({data:result.data,version:Number.MAX_SAFE_INTEGER})).length>4_000_000)throw new Error('Os registros ultrapassam o limite de 4 MB por conta.');
 return result.data;
}
