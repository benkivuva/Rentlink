import {config} from '../config';
import {SheetsService} from './sheets.service';
import {WhatsAppProvider} from '../whatsapp/provider.interface';
import {createHash} from 'node:crypto';
import pino from 'pino';
import {describeError} from '../utils/logger';
const logger=pino({level:config.LOG_LEVEL});
export type AlertType='viewing'|'payment'|'maintenance'|'notice'|'waitlist';
export class AlertService {
 constructor(private readonly wa:WhatsAppProvider,private readonly sheets:SheetsService){}
 async send(type:AlertType,payload:Record<string,string>){const key=createHash('sha256').update(`${type}:${JSON.stringify(payload)}`).digest('hex');if(await this.sheets.hasAlert(key))return;const labels:Record<AlertType,string>={viewing:'Viewing booked',payment:'Payment submitted',maintenance:'Maintenance request',notice:'Notice given',waitlist:'Waitlist signup'};const body=Object.entries(payload).map(([k,v])=>`${k}: ${v}`).join('\n');try{await this.wa.sendText(config.LANDLORD_PHONE,`*${labels[type]}*\n${body}`);}catch(err){logger.error({type,payload,error:describeError(err)},'Landlord alert delivery failed');return;}await this.sheets.markAlert(key);}
}
