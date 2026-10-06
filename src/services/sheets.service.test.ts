import {beforeEach,describe,expect,it,vi} from 'vitest';
import {SheetsService} from './sheets.service';
import {Tenant} from '../types';

const append=vi.fn();
const api={spreadsheets:{values:{append,get:vi.fn(),update:vi.fn()},get:vi.fn(),batchUpdate:vi.fn()}} as any;
const tenant:Tenant={tenantName:'Ada Tenant',firstName:'Ada',phoneNumber:'+254712345678',assignedUnit:'Unit 1A',propertyId:'P1',rentDueDate:'2026-10-01',balance:0,leaseStatus:'Active',waterBill:0,totalBill:0,rentPaid:'No',landlordId:'default'};
let service:SheetsService;

beforeEach(()=>{append.mockReset().mockResolvedValue({});service=new SheetsService('test-sheet',api);});
function assertAppend(range:string,values:unknown[]){
 expect(append).toHaveBeenCalledOnce();
 expect(append).toHaveBeenCalledWith(expect.objectContaining({range,requestBody:{values:[values]}}));
}

describe('SheetsService append schemas',()=>{
 it('appends Payments in the exact eight-column schema order',async()=>{
  api.spreadsheets.values.append=append;
  await service.addPayment(tenant,'M-Pesa confirmation XYZ');
  assertAppend('Payments!A:J',[expect.any(String),'Ada Tenant','+254712345678','Unit 1A','','M-Pesa confirmation XYZ','','Pending']);
 });
 it('appends Maintenance in the exact eight-column schema order',async()=>{
  api.spreadsheets.values.append=append;
  await service.addMaintenance(tenant,'Leaking kitchen tap');
  assertAppend('Maintenance!A:H',[expect.any(String),'Ada Tenant','Unit 1A','+254712345678','','Leaking kitchen tap','','Open']);
 });
 it('appends Notices in the exact six-column schema order',async()=>{
  api.spreadsheets.values.append=append;
  await service.addNotice(tenant,'2026-12-01');
  assertAppend('Notices!A:F',[expect.any(String),'Ada Tenant','+254712345678','Unit 1A','2026-12-01','Received']);
 });
 it('appends Viewings in the exact five-column schema order',async()=>{
  api.spreadsheets.values.append=append;
  await service.addViewing({name:'Ada',phone:'+254712345678',unit:'Unit 1A',time:'Saturday'});
  assertAppend('Viewings!A:E',[expect.any(String),'Ada','+254712345678','Unit 1A','Saturday']);
 });
 it('appends Waitlist in the exact six-column schema order',async()=>{
  api.spreadsheets.values.append=append;
  await service.addWaitlist({phone:'+254712345678',town:'Nairobi',type:'Bedsitter',budget:'15000',name:'Ada'});
  assertAppend('Waitlist!A:F',[expect.any(String),'+254712345678','Nairobi','Bedsitter','15000','Ada']);
 });
 it('appends SentAlerts in the exact three-column schema order',async()=>{
  api.spreadsheets.values.append=append;
  await service.markAlert('viewing:42','landlord-1');
  assertAppend('SentAlerts!A2:C',['viewing:42',expect.any(String),'landlord-1']);
 });
});
