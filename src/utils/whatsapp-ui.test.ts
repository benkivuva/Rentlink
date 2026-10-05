import {describe,expect,it} from 'vitest';
import {apartmentLabel,unitLabel,uniqueLabels} from './whatsapp-ui';

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
