import { z } from 'zod';
export const kenyanPhone = z.string().transform((v) => v.replace(/[\s()-]/g, '')).refine((v) => /^(?:\+254|254|0)?[17]\d{8}$/.test(v), 'Enter a valid Kenyan phone number').transform((v) => v.startsWith('+') ? v : `+${v.startsWith('0') ? `254${v.slice(1)}` : v.startsWith('254') ? v : `254${v}`}`);
export const digitsOnly = (phone:string) => phone.replace(/\D/g, '');
export function normalizePhone(input:string):string|null {
 const value=input.trim();
 if(!/^[+]?[0-9\s-]+$/.test(value))return null;
 const compact=value.replace(/[\s-]/g,'');
 if(/^\+?254[17]\d{8}$/.test(compact))return `+${compact.replace(/^\+/,'')}`;
 if(/^0[17]\d{8}$/.test(compact))return `+254${compact.slice(1)}`;
 return null;
}
