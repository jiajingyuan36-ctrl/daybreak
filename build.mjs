import './prepare-legacy.mjs';
import {spawnSync} from 'node:child_process';
import {cp,rm} from 'node:fs/promises';
const run=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build','--webpack'],{stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
if(run.status!==0)process.exit(run.status??1);
await rm('dist',{recursive:true,force:true});await cp('out','dist',{recursive:true});
console.log('Next.js static export ready: dist/');
