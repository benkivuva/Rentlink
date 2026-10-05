export const localDate = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone:'Africa/Nairobi' }).format(date);
export const addDays = (date:string, days:number) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10); };
