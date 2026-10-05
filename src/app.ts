import express from 'express';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {config} from './config';
import {FlowEngine} from './flow-engine';
import {WhatsAppProvider} from './whatsapp/provider.interface';
export function createApp(engine:FlowEngine,wa:WhatsAppProvider,runReminders?:()=>Promise<void>){const app=express();app.use(express.json({limit:'1mb',verify:(req,_res,buffer)=>(req as express.Request & {rawBody?:Buffer}).rawBody=Buffer.from(buffer)}));
 app.get('/health',(_req,res)=>res.json({status:'ok'}));
 app.get('/webhook',(req,res)=>{const mode=req.query['hub.mode'];const token=req.query['hub.verify_token'];const challenge=req.query['hub.challenge'];if(mode==='subscribe'&&token===config.WEBHOOK_VERIFY_TOKEN)return res.status(200).send(challenge);return res.sendStatus(403);});
 app.post('/webhook',(req,res)=>{if(config.META_APP_SECRET){const sig=req.header('x-hub-signature-256')?.replace('sha256=','')??'';const rawBody=(req as express.Request & {rawBody?:Buffer}).rawBody??Buffer.from('');const expected=createHmac('sha256',config.META_APP_SECRET).update(rawBody).digest('hex');if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return res.sendStatus(401);}res.sendStatus(200);void consume(req.body,engine);});
 app.post('/run-reminders',async(req,res)=>{if(req.header('authorization')!==`Bearer ${config.WEBHOOK_VERIFY_TOKEN}`)return res.sendStatus(401);if(!runReminders)return res.sendStatus(503);await runReminders();return res.json({ok:true});});return app;}
async function consume(body:any,engine:FlowEngine){const messages=body?.entry?.flatMap((e:any)=>e.changes??[]).flatMap((c:any)=>c.value?.messages??[])??[];for(const m of messages){const text=m.text?.body??m.button?.payload??m.interactive?.button_reply?.id??m.interactive?.list_reply?.id;if(m.from&&text)await engine.handle({phone:`+${m.from}`,text,kind:m.type==='interactive'?'list':m.type});}}
