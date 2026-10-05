export class SheetsQueue {
  private tail:Promise<unknown> = Promise.resolve();
  constructor(private readonly attempts=4) {}
  run<T>(operation:()=>Promise<T>):Promise<T> {
    const result = this.tail.then(async()=>{ for(let i=0;;i++){ try{return await operation();} catch(e){ if(i>=this.attempts-1) throw e; await new Promise(r=>setTimeout(r,250*2**i)); } } });
    this.tail = result.catch(()=>undefined); return result;
  }
}
