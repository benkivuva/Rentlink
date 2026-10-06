import {AddressInfo} from 'node:net';
import {once} from 'node:events';
import {describe,expect,it,vi} from 'vitest';
import {createApp} from './app';
import {config} from './config';

async function withServer(app:ReturnType<typeof createApp>,run:(baseUrl:string)=>Promise<void>){
 const server=app.listen(0);
 await once(server,'listening');
 const address=server.address() as AddressInfo;
 try{await run(`http://127.0.0.1:${address.port}`);}finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
}

describe('admin cron endpoint',()=>{
 it('authenticates, rejects unknown jobs, and runs a valid job',async()=>{
  const receipts=vi.fn(async()=>({sent:1}));
  const app=createApp({} as any,{} as any,{reminders:vi.fn(async()=>undefined),report:vi.fn(async()=>undefined),receipts});
  await withServer(app,async base=>{
   const noAuth=await fetch(`${base}/admin/cron/receipts`,{method:'POST'});
   expect(noAuth.status).toBe(401);
   const headers={authorization:`Bearer ${config.WEBHOOK_VERIFY_TOKEN}`};
   const unknown=await fetch(`${base}/admin/cron/nope`,{method:'POST',headers});
   expect(unknown.status).toBe(404);
   expect(await unknown.json()).toEqual({error:'Unknown job',jobs:['reminders','report','receipts']});
   const valid=await fetch(`${base}/admin/cron/receipts`,{method:'POST',headers});
   expect(valid.status).toBe(200);
   expect(await valid.json()).toMatchObject({ok:true,job:'receipts',result:{sent:1}});
   expect(receipts).toHaveBeenCalledOnce();
  });
 },20000);

 it('returns 503 when no scheduler is wired',async()=>{
  const app=createApp({} as any,{} as any);
  await withServer(app,async base=>{
   const res=await fetch(`${base}/admin/cron/receipts`,{method:'POST',headers:{authorization:`Bearer ${config.WEBHOOK_VERIFY_TOKEN}`}});
   expect(res.status).toBe(503);
  });
 },20000);
});
