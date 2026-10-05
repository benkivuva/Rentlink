import {config} from '../config';
import {Session} from '../types';
import {SheetsService} from './sheets.service';
export interface SessionStore { get(phone:string):Promise<Session|undefined>; set(session:Session):Promise<void>; clear(phone:string):Promise<void> }
export class MemorySessionStore implements SessionStore { private readonly values=new Map<string,Session>(); async get(phone:string){return this.values.get(phone);} async set(s:Session){this.values.set(s.phone,s);} async clear(phone:string){this.values.delete(phone);} }
export class SheetsSessionStore implements SessionStore { constructor(private readonly sheets:SheetsService){} async get(phone:string){return this.sheets.getLatestSession(phone);} async set(s:Session){await this.sheets.addSession(s.phone,s.flow,s.step,s.context,s.landlordId);} async clear(phone:string){await this.sheets.addSession(phone,'','',{});} }
export const createSessionStore=(sheets:SheetsService):SessionStore=>config.SESSION_STORE==='sheets'?new SheetsSessionStore(sheets):new MemorySessionStore();
