import {createHash} from 'node:crypto';
import {PaymentRow,SheetsService} from './sheets.service';
import {WhatsAppProvider} from '../whatsapp/provider.interface';

export async function sendPaymentReceipt(sheets:SheetsService,wa:WhatsAppProvider,paymentRow:PaymentRow){
 const identity=paymentRow.mpesaCode||createHash('sha256').update(`${paymentRow.date}|${paymentRow.phone}|${paymentRow.unit}|${paymentRow.message}`).digest('hex');
 const key=`receipt-${identity}`;
 if(await sheets.hasAlert(key,paymentRow.landlordId))return false;
 await wa.sendText(paymentRow.phone,`*Payment receipt*\nTenant: ${paymentRow.tenantName}\nUnit: ${paymentRow.unit}\nAmount: KES ${paymentRow.amount.toLocaleString()}\nM-Pesa: ${paymentRow.message}\nDate: ${paymentRow.date}`);
 await sheets.markAlert(key,paymentRow.landlordId);
 return true;
}
