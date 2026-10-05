import { z } from 'zod';
export const kenyanPhone = z.string().transform((v) => v.replace(/[\s()-]/g, '')).refine((v) => /^(?:\+254|254|0)?[17]\d{8}$/.test(v), 'Enter a valid Kenyan phone number').transform((v) => v.startsWith('+') ? v : `+${v.startsWith('0') ? `254${v.slice(1)}` : v.startsWith('254') ? v : `254${v}`}`);
export const digitsOnly = (phone:string) => phone.replace(/\D/g, '');
