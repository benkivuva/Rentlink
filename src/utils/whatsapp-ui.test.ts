import {describe,expect,it} from 'vitest';
import {apartmentLabel,unitLabel,uniqueLabels,BODY_LIMIT,chunkMessage} from './whatsapp-ui';

describe('WhatsApp selection labels',()=>{
  it('uses a unit suffix after the final separator',()=>expect(unitLabel('Sunset Ridge Apartments - Unit 1B')).toBe('Unit 1B'));
  it('uses the final two words when there is no separator',()=>expect(unitLabel('Sunset Ridge Unit 1B')).toBe('Unit 1B'));
  it('deduplicates labels after applying WhatsApp title limits',()=>{
    const names=['Sunset Ridge Apartments - Unit 1B','Sunset Ridge Apartments - Unit 2B'];
    const labels=uniqueLabels(names,unitLabel,20);
    expect(new Set(labels).size).toBe(2);
    expect(labels.every(label=>label.length<=20)).toBe(true);
  });
  it('builds compact apartment labels',()=>expect(apartmentLabel('Sunset Ridge Apartments Phase 2')).toBe('Sunset Ridge'));
});

describe('WhatsApp message chunking',()=>{
  it('returns short text as one chunk',()=>expect(chunkMessage('Short message')).toEqual(['Short message']));
  it('splits long text on newline boundaries when possible',()=>{
    const text='first line\nsecond line\nthird line';
    const chunks=chunkMessage(text,12);
    expect(chunks.join('')).toBe(text);
    expect(chunks.slice(0,-1).every(chunk=>chunk.endsWith('\n'))).toBe(true);
  });
  it('splits text without newlines at the limit boundary',()=>expect(chunkMessage('abcdefghij',4)).toEqual(['abcd','efgh','ij']));
  it('never returns empty chunks or chunks over BODY_LIMIT',()=>{
    const chunks=chunkMessage(`header\n${'x'.repeat(BODY_LIMIT*2+1)}`);
    expect(chunks.every(chunk=>chunk.length>0)).toBe(true);
    expect(chunks.every(chunk=>chunk.length<=BODY_LIMIT)).toBe(true);
  });
});
