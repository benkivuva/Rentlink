import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000), LOG_LEVEL: z.string().default('info'),
  WHATSAPP_PROVIDER: z.enum(['meta', 'twilio', 'flaresend', 'mock']).default('mock'),
  META_PHONE_NUMBER_ID: z.string().optional(), META_ACCESS_TOKEN: z.string().optional(), META_WABA_ID: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(), TWILIO_AUTH_TOKEN: z.string().optional(), TWILIO_WHATSAPP_NUMBER: z.string().optional(),
  FLARESEND_API_KEY: z.string().optional(), FLARESEND_BASE_URL: z.string().url().default('https://api.flaresend.com/v1'),
  GOOGLE_SHEETS_ID: z.string().optional(), GOOGLE_SERVICE_ACCOUNT_JSON: z.string().default('./service-account.json'),
  LANDLORD_ID: z.string().default('default'), LANDLORD_PHONE: z.string().default('+254700000000'),
  LANDLORD_TILL_NUMBER: z.string().default('000000'), SESSION_STORE: z.enum(['memory', 'sheets']).default('memory'),
  WEBHOOK_VERIFY_TOKEN: z.string().default('replace-me'), META_APP_SECRET: z.string().optional()
});
export const config = schema.parse(process.env);
export const sheetNames = { properties: 'Properties', tenants: 'Tenants', payments: 'Payments', notices: 'Notices', maintenance: 'Maintenance', waitlist: 'Waitlist', viewings: 'Viewings', sessions: 'Sessions', sentAlerts: 'SentAlerts' } as const;
export const headers = {
  Properties: ['PropertyID','Town','UnitName','Type','Rent','Deposit','Apartment','Amenities','Status','ImageURL','MapURL','BudgetTier'],
  Tenants: ['TenantName','FirstName','PhoneNumber','AssignedUnit','PropertyID','RentDueDate','Balance','LeaseStatus','WaterBill','TotalBill','RentPaid'],
  Payments: ['Date','TenantName','PhoneNumber','Unit','Amount','MpesaMessage','MpesaCode','Status','ReceiptURL','Duplicate?'],
  Notices: ['Date','TenantName','PhoneNumber','Unit','MoveOutDate','Status'],
  Maintenance: ['Date','TenantName','Unit','Phone','Category','Description','PreferredTime','Status'],
  Waitlist: ['Date','Phone','Town','Type','Budget'], Viewings: ['Date','ClientName','Phone','Unit','PreferredTime'],
  Sessions: ['Phone','CurrentFlow','CurrentStep','Context','UpdatedAt','LandlordID'], SentAlerts: ['AlertKey','SentAt','LandlordID']
} as const;
