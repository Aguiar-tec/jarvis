import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBackup} from '../lib/backup.ts';
import {demoWorkspace} from '../lib/jarvis.ts';
test('legacy and versioned exports preserve every workspace field',()=>{
 const data=demoWorkspace('Daniel','2026-09-17');
 for(const version of [undefined,1])assert.deepEqual(parseBackup(JSON.stringify({application:'JARVIS',schemaVersion:version,exportedAt:'2026-09-17',data})),data);
});
test('import rejects foreign, future, malformed and inconsistent backups',()=>{
 const data=demoWorkspace('Daniel','2026-09-17');
 for(const bad of ['{','null',JSON.stringify({application:'other',data}),JSON.stringify({application:'JARVIS',schemaVersion:2,data})])assert.throws(()=>parseBackup(bad));
 data.tasks[0].areaId='missing';assert.throws(()=>parseBackup(JSON.stringify({application:'JARVIS',data})),/inválidos/);
});
