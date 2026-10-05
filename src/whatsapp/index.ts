import {config} from '../config';
import {HttpProvider} from './http';
import {MockProvider} from './mock.provider';
import {WhatsAppProvider} from './provider.interface';
const required=(value:string|undefined,key:string)=>{if(!value)throw new Error(`${key} is required`);return value;};
export function createWhatsAppProvider():WhatsAppProvider {
  if(config.WHATSAPP_PROVIDER==='mock')return new MockProvider();
  if(config.WHATSAPP_PROVIDER==='meta'){const id=required(config.META_PHONE_NUMBER_ID,'META_PHONE_NUMBER_ID');const token=required(config.META_ACCESS_TOKEN,'META_ACCESS_TOKEN');required(config.META_WABA_ID,'META_WABA_ID');return new HttpProvider(`https://graph.facebook.com/v21.0/${id}/messages`,{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},id,(to,type,p)=>metaPayload(to,type,p));}
  if(config.WHATSAPP_PROVIDER==='twilio'){const sid=required(config.TWILIO_ACCOUNT_SID,'TWILIO_ACCOUNT_SID');const auth=required(config.TWILIO_AUTH_TOKEN,'TWILIO_AUTH_TOKEN');const from=required(config.TWILIO_WHATSAPP_NUMBER,'TWILIO_WHATSAPP_NUMBER');return new HttpProvider(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,{Authorization:`Basic ${Buffer.from(`${sid}:${auth}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},from,(to,type,p)=>new URLSearchParams({From:`whatsapp:${from}`,To:`whatsapp:${to}`,Body:type==='text'?(p as {text:string}).text:JSON.stringify(p)}));}
  const key=required(config.FLARESEND_API_KEY,'FLARESEND_API_KEY');return new HttpProvider(`${config.FLARESEND_BASE_URL}/messages`,{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},'',(to,type,p)=>({to,type,...p as object}));
}
function metaPayload(to:string,type:string,p:unknown){
  const base={messaging_product:'whatsapp',recipient_type:'individual',to};
  if(type==='text')return {...base,type:'text',text:{body:(p as {text:string}).text}};
  if(type==='image'){const v=p as {imageUrl:string;caption?:string};return {...base,type:'image',image:{link:v.imageUrl,caption:v.caption}};}
  if(type==='buttons'){
    const v=p as {text:string;buttons:{id:string;title:string}[]};
    return {...base,type:'interactive',interactive:{type:'button',body:{text:v.text},action:{buttons:v.buttons.map(b=>({type:'reply',reply:{id:b.id,title:b.title.slice(0,20)}}))}}};
  }
  const v=p as {text:string;sections:{title:string;rows:{id:string;title:string;description?:string}[]}[];buttonLabel:string};
  return {...base,type:'interactive',interactive:{type:'list',body:{text:v.text},action:{button:v.buttonLabel,sections:v.sections}}};
}
