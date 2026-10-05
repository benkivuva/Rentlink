import {describe,it,expect,vi} from 'vitest';
import {FlowEngine} from './flow-engine';
import {MemorySessionStore} from './services/session.service';

function setup(){
 const sent:string[]=[];const wa={sendText:vi.fn(async(_to:string,text:string)=>{sent.push(text)}),sendButtons:vi.fn(async(_to:string,text:string)=>{sent.push(text)}),sendList:vi.fn(async()=>{}),sendImage:vi.fn(async()=>{})};
 const sheets={addSession:vi.fn(async()=>{}),getAvailableUnits:vi.fn(async()=>[]),getTenantByPhone:vi.fn(async()=>undefined)};
 const alerts={send:vi.fn(async()=>{})};
 return {engine:new FlowEngine(wa as any,sheets as any,new MemorySessionStore(),alerts as any),wa,sheets,sent};
}
describe('conversation entry flows',()=>{
 it('shows customer menu for a new conversation',async()=>{const {engine,wa}=setup();await engine.handle({phone:'+254712345678',text:'hello'});expect(wa.sendButtons).toHaveBeenCalled();});
 it('starts quick search from the menu selection',async()=>{const {engine,wa}=setup();await engine.handle({phone:'+254712345678',text:'quick',kind:'button'});expect(wa.sendText).toHaveBeenCalledWith('+254712345678',expect.stringContaining('apartment name'));});
 it('starts tenant verification on tenant keyword',async()=>{const {engine,wa}=setup();await engine.handle({phone:'+254712345678',text:'tenant'});expect(wa.sendText).toHaveBeenCalledWith('+254712345678',expect.stringContaining('last 9 digits'));});
 it('offers recovery when tenant lookup fails',async()=>{const {engine,wa}=setup();await engine.handle({phone:'+254712345678',text:'tenant'});await engine.handle({phone:'+254712345678',text:'123456789'});expect(wa.sendButtons).toHaveBeenCalledWith('+254712345678','Account not found.',expect.arrayContaining([expect.objectContaining({id:'retry'})]));});
});
