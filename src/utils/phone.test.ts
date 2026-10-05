import {describe,it,expect} from 'vitest';
import {kenyanPhone} from './phone';
describe('Kenyan phone normalization',()=>{it('normalizes local format',()=>expect(kenyanPhone.parse('0712345678')).toBe('+254712345678'));it('rejects invalid input',()=>expect(kenyanPhone.safeParse('123').success).toBe(false));});
