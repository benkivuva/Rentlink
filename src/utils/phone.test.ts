import {describe,it,expect} from 'vitest';
import {kenyanPhone,normalizePhone} from './phone';
describe('Kenyan phone normalization',()=>{it('normalizes local format',()=>expect(kenyanPhone.parse('0712345678')).toBe('+254712345678'));it('rejects invalid input',()=>expect(kenyanPhone.safeParse('123').success).toBe(false));});
describe('normalizePhone',()=>{
 it.each(['+254712345678','254712345678','0712345678','0112345678'])('normalizes accepted format %s',input=>expect(normalizePhone(input)).toBe(input==='0112345678'?'+254112345678':'+254712345678'));
 it('accepts spaces and dashes',()=>expect(normalizePhone('+254 712-345-678')).toBe('+254712345678'));
 it('rejects a non-Kenyan number',()=>expect(normalizePhone('123456789')).toBeNull());
});
