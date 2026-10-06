import pino from 'pino';
import {config} from './config';
import {messages} from './messages';
import {AlertService} from './services/alerts.service';
import {SessionStore} from './services/session.service';
import {SheetsService} from './services/sheets.service';
import {Tenant} from './types';
import {digitsOnly,normalizePhone} from './utils/phone';
import {apartmentLabel,unitLabel,uniqueLabels} from './utils/whatsapp-ui';
import {describeError} from './utils/logger';
import {WhatsAppProvider} from './whatsapp/provider.interface';
const log=pino({level:config.LOG_LEVEL});
type Incoming={phone:string;text:string;kind?:'text'|'button'|'list'};
export class FlowEngine {
 constructor(private readonly wa:WhatsAppProvider,private readonly sheets:SheetsService,private readonly sessions:SessionStore,private readonly alerts:AlertService){}
 private async save(phone:string,flow:string,step:string,context:Record<string,unknown>={}){const s={phone,flow,step,context,updatedAt:new Date().toISOString(),landlordId:config.LANDLORD_ID};await this.sessions.set(s);}
 async handle(m:Incoming){const phone=m.phone;const correlation=digitsOnly(phone);const logctx=log.child({correlationId:correlation});const text=m.text.trim();const keyword=text.toLowerCase();let s=await this.sessions.get(phone);if(/^(hi|hello|menu|start)$/i.test(text)){await this.sessions.clear(phone);return this.main(phone);}if(keyword==='tenant'){if(s?.flow==='tenantMenu')return this.tenantMenu(phone);await this.save(phone,'tenantVerify','phone');return this.wa.sendText(phone,'Please type your registered phone number.');}
  if(!s){if(keyword==='browse'){await this.save(phone,'browse','town');return this.askBrowse(phone,'browse');}if(keyword==='quick'){await this.save(phone,'quick','search');return this.askBrowse(phone,'quick');}if(keyword==='agent')return this.wa.sendText(phone,`Contact our agent: https://wa.me/${digitsOnly(config.LANDLORD_PHONE)}?text=Hi%2C%20I%27m%20interested%20in%20a%20unit`);if(keyword==='retry'){await this.save(phone,'tenantVerify','phone');return this.wa.sendText(phone,'Please type your registered phone number.');}if(['balance','payment','issue','notice','manager','status'].includes(keyword))return this.tenantAction(phone,keyword,{});return this.main(phone);}
  const c=s.context;
  try {
   if(s.flow==='browse'||s.flow==='quick') return this.browse(phone,s,text);
   if(s.flow==='tenantVerify'){const normalized=normalizePhone(text);const tenant=normalized?await this.sheets.getTenantByPhone(normalized):undefined;if(!tenant){await this.sessions.clear(phone);return this.wa.sendButtons(phone,'Account not found.',[{id:'retry',title:'Try Again'},{id:'main',title:'Main Menu'}]);}await this.save(phone,'tenantMenu','menu',{phone:tenant.phoneNumber});await this.wa.sendText(phone,`Welcome ${tenant.firstName||tenant.tenantName}, ${tenant.assignedUnit}.`);return this.tenantMenu(phone);}
   if(s.flow==='tenantMenu')return this.tenantAction(phone,text,c);
   if(s.flow==='viewing'){const v={...c,[s.step]:text};if(s.step==='name'){await this.save(phone,s.flow,'phone',v);return this.wa.sendText(phone,'What phone number should we use?');}if(s.step==='phone'){const normalized=normalizePhone(text);if(!normalized)return this.wa.sendText(phone,'Please enter a valid Kenyan phone number, such as +254712345678.');v.phone=normalized;await this.save(phone,s.flow,'time',v);return this.wa.sendText(phone,'What day and time would you prefer?');}const unit=String(v.unit??'');await this.sheets.addViewing({name:String(v.name),phone:String(v.phone),unit,time:text});await this.alerts.send('viewing',{name:String(v.name),phone:String(v.phone),unit,time:text});await this.sessions.clear(phone);return this.wa.sendText(phone,'Thanks. Your viewing request has been sent to the agent.');}
   if(s.flow==='payment'||s.flow==='issue'||s.flow==='notice')return this.tenantSubmission(phone,s,text);
   if(s.flow==='waitlist')return this.waitlist(phone,s,text);
   return this.main(phone);
  } catch(err){logctx.error({error:describeError(err),flow:s.flow},'Message handling failed');await this.wa.sendText(phone,'Sorry, something went wrong. Reply *menu* to return to the main menu.');}
 }
 private async main(phone:string){await this.wa.sendButtons(phone,messages.welcome,messages.customerMenu);await this.wa.sendText(phone,'Existing tenant? Reply *tenant* to open tenant services.');}
 private async browse(phone:string,s:{flow:string;step:string;context:Record<string,unknown>},text:string):Promise<void>{const c={...s.context};const keyword=text.toLowerCase();const ask=async(step:string,msg:string,buttons?:{id:string;title:string}[])=>{await this.save(phone,s.flow,step,c);return buttons?this.wa.sendButtons(phone,msg,buttons):this.wa.sendText(phone,msg);};
  if(s.flow==='quick'&&s.step==='search'){c.search=text;return ask('type','Choose unit type:',[{id:'1 Bed Apartment',title:'1 Bed'},{id:'2 Bed Apartment',title:'2 Bed'}]);}
  if(s.step==='town'||s.step==='search'){c[s.step]=text;return ask(s.step==='town'?'type':'type',s.step==='town'?'Choose unit type:':'Choose unit type:',[{id:'1 Bed Apartment',title:'1 Bed'},{id:'2 Bed Apartment',title:'2 Bed'}]);}
  if(s.step==='type'){c.type=text;return ask('budget','Choose your budget:',[{id:'Under 15k',title:'Under 15k'},{id:'15k - 25k',title:'15k - 25k'},{id:'25k+',title:'25k+'}]);}
  if(s.step==='budget'){
   c.budgetTier=text;
   const rows=await this.sheets.getAvailableUnits({town:c.town as string|undefined,type:String(c.type??''),budgetTier:text,search:c.search as string|undefined});
   if(!rows.length){await this.save(phone,'waitlist','consent',{town:c.town??'',type:c.type??'',budget:text});return this.wa.sendButtons(phone,'No matching homes are available. Would you like us to notify you when one opens?', [{id:'yes',title:'Yes, notify me'},{id:'no',title:'No thanks'}]);}
   const apartments=[...new Set(rows.map(p=>p.apartment))];
   const shown=apartments.slice(0,10);
   const labels=uniqueLabels(shown,apartmentLabel,20);
   await this.save(phone,s.flow,'apartment',c);
   if(apartments.length<=3)return this.wa.sendButtons(phone,'Available apartments:',shown.map((id,index)=>({id,title:labels[index]!})));
   await this.wa.sendList(phone,'Available apartments:',[{title:'Apartments',rows:shown.map((id,index)=>({id,title:labels[index]!}))}],'Choose Apartment');
   if(apartments.length>10)await this.wa.sendText(phone,'Showing first 10 matches. Reply *agent* to see more.');
   return;
  }
  if(s.step==='apartment'){
   c.apartment=text;
   const rows=await this.sheets.getAvailableUnits({town:c.town as string|undefined,type:String(c.type??''),budgetTier:String(c.budgetTier??''),apartment:text,search:c.search as string|undefined});
   if(!rows.length)return this.wa.sendText(phone,'No units are currently available in this apartment.');
   await this.save(phone,s.flow,'unit',c);
   if(rows.length<=3){const labels=uniqueLabels(rows.map(p=>p.unitName),unitLabel,20);return this.wa.sendButtons(phone,'Choose a unit:',rows.map((unit,index)=>({id:unit.unitName,title:labels[index]!})));}
   const shown=rows.slice(0,10);
   const labels=uniqueLabels(shown.map(unit=>unit.unitName),unitLabel,20);
   await this.wa.sendList(phone,'Choose a unit:',[{title:String(c.apartment).slice(0,24),rows:shown.map((unit,index)=>({id:unit.unitName,title:labels[index]!,description:`KES ${unit.rent.toLocaleString()} · ${unit.type}`.slice(0,72)}))}],'Choose Unit');
   if(rows.length>10)await this.wa.sendText(phone,'Showing first 10 matches. Reply *agent* to see more.');
   return;
  }
  if(s.step==='unit'){const rows=await this.sheets.getAvailableUnits({town:c.town as string|undefined,type:String(c.type??''),budgetTier:String(c.budgetTier??''),apartment:String(c.apartment??''),search:c.search as string|undefined});const p=rows.find(x=>x.unitName===text);if(!p)return this.wa.sendText(phone,'Please choose one of the listed units.');c.unit=p.unitName;await this.save(phone,s.flow,'actions',c);await this.wa.sendText(phone,`*${p.unitName}* — ${p.apartment}\nRent: KES ${p.rent.toLocaleString()}\nDeposit: KES ${p.deposit.toLocaleString()}\nAmenities: ${p.amenities}${p.mapUrl?`\nMap: ${p.mapUrl}`:''}`);if(p.imageUrl)await this.wa.sendImage(phone,p.imageUrl);return this.wa.sendButtons(phone,'What would you like to do?', [{id:'viewing',title:'Book a Viewing'},{id:'back',title:'Back to List'},{id:'main',title:'Main Menu'}]);}
  if(s.step==='actions'){if(keyword==='viewing'){await this.save(phone,'viewing','name',{unit:c.unit});return this.wa.sendText(phone,'What is your name?');}if(keyword==='back'){return this.browse(phone,{flow:s.flow,step:'apartment',context:c},String(c.apartment??''));}return this.main(phone);}
  return this.askBrowse(phone,s.flow);
 }
 private async askBrowse(phone:string,flow:string){await this.save(phone,flow,flow==='quick'?'search':'town');return flow==='quick'?this.wa.sendText(phone,'Type an apartment name (for example Zayoni, Hope, Liberty or Sunset).'):this.wa.sendButtons(phone,'Which town?', [{id:'Kitengela',title:'Kitengela'},{id:'Athi River',title:'Athi River'}]);}
 private async tenantMenu(phone:string){return this.wa.sendButtons(phone,'Tenant services — choose an option:',messages.tenantMenu.slice(0,3)).then(()=>this.wa.sendButtons(phone,'More tenant services:',messages.tenantMenu.slice(3)));}
 private async tenantResult(phone:string,text:string){return this.wa.sendButtons(phone,text,[{id:'menu',title:'Back to Menu'}]);}
 private async tenantAction(phone:string,action:string,c:Record<string,unknown>){const t=await this.sheets.getTenantByPhone(String(c.phone??phone));if(!t)return this.wa.sendText(phone,'Account not found. Reply *tenant* to try again.');if(/balance/i.test(action)){const fresh=await this.sheets.getTenantByPhone(t.phoneNumber) as Tenant;return this.tenantResult(phone,`*${fresh.tenantName}* · ${fresh.assignedUnit}\nRent balance: KES ${fresh.balance}\nWater bill: KES ${fresh.waterBill}\nTotal due: KES ${fresh.totalBill}\nDue date: ${fresh.rentDueDate}\nLease: ${fresh.leaseStatus}\nTill: ${config.LANDLORD_TILL_NUMBER}`);}if(/payment/i.test(action)){await this.save(phone,'payment','message',{tenant:t});return this.wa.sendText(phone,'Paste your full M-Pesa confirmation message.');}if(/issue/i.test(action)){await this.save(phone,'issue','description',{tenant:t});return this.wa.sendText(phone,'Describe the issue you are facing.');}if(/notice/i.test(action)){await this.save(phone,'notice','date',{tenant:t});return this.wa.sendText(phone,'What is your intended move-out date?');}if(/manager/i.test(action))return this.tenantResult(phone,`Talk to your manager: https://wa.me/${digitsOnly(config.LANDLORD_PHONE)}?text=Hi%2C%20I%20need%20help%20with%20${encodeURIComponent(t.assignedUnit)}`);if(/status/i.test(action)){const rows=await this.sheets.getPaymentRows();const p=rows.filter(x=>x.phone===t.phoneNumber).at(-1);return this.tenantResult(phone,p?`Your latest payment is ${p.status.toLowerCase()}.`:'No payment records found.');}return this.tenantMenu(phone);}
 private async tenantSubmission(phone:string,s:{flow:string;context:Record<string,unknown>},text:string){const t=s.context.tenant as Tenant;if(s.flow==='payment'){await this.sheets.addPayment(t,text);await this.alerts.send('payment',{tenant:t.tenantName,propertyId:t.propertyId,unit:t.assignedUnit,message:text});}else if(s.flow==='issue'){await this.sheets.addMaintenance(t,text);await this.alerts.send('maintenance',{tenant:t.tenantName,propertyId:t.propertyId,unit:t.assignedUnit,phone:t.phoneNumber,description:text});}else{await this.sheets.addNotice(t,text);await this.alerts.send('notice',{tenant:t.tenantName,propertyId:t.propertyId,unit:t.assignedUnit,phone:t.phoneNumber,moveOutDate:text});}await this.sessions.clear(phone);return this.tenantResult(phone,s.flow==='payment'?"We'll verify and send your receipt shortly.":'Thank you. Your request has been recorded.');}
 private async waitlist(phone:string,s:{step:string;context:Record<string,unknown>},text:string){if(s.step==='consent'){if(/^no/i.test(text)){await this.sessions.clear(phone);return this.main(phone);}if(!/^yes/i.test(text))return this.wa.sendText(phone,'Please choose Yes, notify me or No thanks.');await this.save(phone,'waitlist','phone',s.context);return this.wa.sendText(phone,'What phone number should we use?');}const normalized=normalizePhone(text);if(!normalized)return this.wa.sendText(phone,'Enter a valid Kenyan number, such as +254712345678.');const x=s.context;await this.sheets.addWaitlist({phone:normalized,town:String(x.town??''),type:String(x.type??''),budget:String(x.budget??'')});await this.alerts.send('waitlist',{phone:normalized,town:String(x.town??''),type:String(x.type??''),budget:String(x.budget??'')});await this.sessions.clear(phone);return this.wa.sendText(phone,'You are on the waitlist. We will contact you when there is a match.');}
}
