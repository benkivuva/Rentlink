import cron from 'node-cron';
import {config} from '../config';
import {SheetsService} from './sheets.service';
import {WhatsAppProvider} from '../whatsapp/provider.interface';
import {AlertService} from './alerts.service';
import {addDays,localDate} from '../utils/dates';
import {digitsOnly} from '../utils/phone';
import {createHash} from 'node:crypto';
export function startScheduler(sheets:SheetsService,wa:WhatsAppProvider,alerts:AlertService){
 cron.schedule('0 9 * * *',()=>runDailyReminders(sheets,wa,alerts));
 cron.schedule('0 9 5 * *',()=>runMonthlyReport(sheets,wa));
 cron.schedule('*/15 * * * *',()=>runReceipts(sheets,wa));
 return cron.getTasks();
}
export async function runDailyReminders(sheets:SheetsService,wa:WhatsAppProvider,_alerts:AlertService){const today=localDate();const tenants=await sheets.getTenants();const overdue:string[]=[];for(const t of tenants){if(t.rentPaid.toLowerCase()==='yes')continue;if(t.rentDueDate===addDays(today,3))await wa.sendText(t.phoneNumber,`Rent reminder: payment is due in 3 days. Rent + water total: KES ${t.totalBill}. Till: ${config.LANDLORD_TILL_NUMBER}`);if(t.rentDueDate===today)await wa.sendText(t.phoneNumber,`Your rent is due today. Total due: KES ${t.totalBill}. Till: ${config.LANDLORD_TILL_NUMBER}`);if(t.rentDueDate<addDays(today,-3)){await wa.sendText(t.phoneNumber,`Your rent is overdue. Total due: KES ${t.totalBill}. Please contact management if you need assistance.`);overdue.push(`${t.tenantName} (${t.assignedUnit}): KES ${t.totalBill}`);}}if(overdue.length)await wa.sendText(config.LANDLORD_PHONE,`*Overdue rent summary*\n${overdue.join('\n')}`);}
export async function runMonthlyReport(sheets:SheetsService,wa:WhatsAppProvider){const tenants=await sheets.getTenants();const paid=tenants.filter(t=>t.rentPaid.toLowerCase()==='yes').length;const outstanding=tenants.filter(t=>t.rentPaid.toLowerCase()!=='yes').reduce((n,t)=>n+t.totalBill,0);await wa.sendText(config.LANDLORD_PHONE,`*Monthly collection report*\nUnits: ${tenants.length}\nPaid: ${paid} (${tenants.length?Math.round(paid/tenants.length*100):0}%)\nOutstanding: KES ${outstanding}`);}
export async function runReceipts(sheets:SheetsService,wa:WhatsAppProvider){const rows=await sheets.getPaymentRows();for(const p of rows){if(p.status.toLowerCase()==='verified'&&p.duplicate.toLowerCase()!=='yes'){const identity=p.mpesaCode||createHash('sha256').update(`${p.date}|${p.phone}|${p.unit}|${p.message}`).digest('hex');const key=`receipt-${identity}`;if(await sheets.hasAlert(key,p.landlordId))continue;await wa.sendText(p.phone,`*Payment receipt*\nTenant: ${p.tenantName}\nUnit: ${p.unit}\nM-Pesa: ${p.message}\nDate: ${p.date}`);await sheets.markAlert(key,p.landlordId);}}}
