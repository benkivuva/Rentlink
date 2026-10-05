import {describe,expect,it,vi} from 'vitest';
import {AlertService} from './alerts.service';

describe('AlertService',()=>{
  it('does not rethrow a delivery failure or mark the alert as sent',async()=>{
    const sheets={hasAlert:vi.fn().mockResolvedValue(false),markAlert:vi.fn().mockResolvedValue(undefined)};
    const wa={sendText:vi.fn().mockRejectedValue(Object.assign(new Error('rate limited'),{response:{status:429,data:{message:'too many requests'}}}))};
    const alerts=new AlertService(wa as any,sheets as any);

    await expect(alerts.send('viewing',{phone:'+254700000000'})).resolves.toBeUndefined();
    expect(sheets.markAlert).not.toHaveBeenCalled();
  });

  it('marks an alert only after delivery succeeds',async()=>{
    const calls:string[]=[];
    const sheets={hasAlert:vi.fn().mockResolvedValue(false),markAlert:vi.fn(async()=>{calls.push('marked');})};
    const wa={sendText:vi.fn(async()=>{calls.push('sent');})};
    const alerts=new AlertService(wa as any,sheets as any);

    await alerts.send('viewing',{phone:'+254700000000'});
    expect(calls).toEqual(['sent','marked']);
  });
});
