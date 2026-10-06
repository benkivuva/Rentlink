export const BODY_LIMIT=1000;

export function chunkMessage(text:string,limit=BODY_LIMIT):string[]{
  if(!Number.isInteger(limit)||limit<1)throw new RangeError('Message chunk limit must be a positive integer');
  if(!text)return [];
  const chunks:string[]=[];
  let offset=0;
  while(offset<text.length){
    let end=Math.min(offset+limit,text.length);
    if(end<text.length){
      const newline=text.lastIndexOf('\n',end-1);
      if(newline>=offset)end=newline+1;
    }
    chunks.push(text.slice(offset,end));
    offset=end;
  }
  return chunks;
}

export const unitLabel = (unitName:string):string => {
  const separator=' - ';
  const separatorIndex=unitName.lastIndexOf(separator);
  const label=separatorIndex>=0
    ? unitName.slice(separatorIndex+separator.length).trim()
    : unitName.trim().split(/\s+/).slice(-2).join(' ');
  return (label||unitName.trim()).slice(0,20);
};

export const apartmentLabel = (apartmentName:string):string =>
  apartmentName.trim().split(/\s+/).slice(0,2).join(' ').slice(0,20);

export const uniqueLabels = (values:string[], makeLabel:(value:string)=>string, maxLength=20):string[] => {
  const used=new Set<string>();
  return values.map((value,index)=>{
    const base=(makeLabel(value).trim()||`Item ${index+1}`).slice(0,maxLength);
    if(!used.has(base)){used.add(base);return base;}
    for(let suffixNumber=2;;suffixNumber++){
      const suffix=` (${suffixNumber})`;
      const candidate=`${base.slice(0,Math.max(0,maxLength-suffix.length))}${suffix}`;
      if(!used.has(candidate)){used.add(candidate);return candidate;}
    }
  });
};
