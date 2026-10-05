export const parseAmount = (v:unknown):number => {
  if(typeof v==='number'&&Number.isFinite(v))return v;
  if(typeof v==='string'){
    const cleaned=v.replace(/[^0-9.-]/g,'');
    if(cleaned===''||cleaned==='-'||cleaned==='.')return 0;
    const n=Number(cleaned);
    return Number.isFinite(n)?n:0;
  }
  return 0;
};
