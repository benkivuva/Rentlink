import {describe,expect,it} from 'vitest';
import {config} from '../config';
import {normalizePhone} from '../utils/phone';
import {resolveLandlord} from './landlord.service';

describe('resolveLandlord',()=>{
 const canonical=normalizePhone(config.LANDLORD_PHONE)!;
 const digits=canonical.slice(1);
 it.each([canonical,digits,`0${digits.slice(3)}`,`+${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,9)} ${digits.slice(9)}`])('resolves configured phone format %s',phone=>expect(resolveLandlord(phone)).toMatchObject({id:config.LANDLORD_ID,phone:canonical}));
 it('returns null for a different phone',()=>{const other=canonical==='+254799999999'?'+254788888888':'+254799999999';expect(resolveLandlord(other)).toBeNull();});
});
