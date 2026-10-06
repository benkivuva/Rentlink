import {config} from '../config';
import {normalizePhone} from '../utils/phone';

export interface Landlord {id:string;phone:string;name:string}

// Keep landlord lookup here so storage can move to a Landlords sheet without changing callers.
export function resolveLandlord(phone:string):Landlord|null {
 const normalized=normalizePhone(phone);
 const configuredPhone=normalizePhone(config.LANDLORD_PHONE);
 if(!normalized||!configuredPhone||normalized!==configuredPhone)return null;
 return {id:config.LANDLORD_ID,phone:configuredPhone,name:'RentLink Landlord'};
}
