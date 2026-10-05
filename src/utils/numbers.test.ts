import {describe,expect,it} from 'vitest';
import {parseAmount} from './numbers';

describe('parseAmount',()=>{
  it.each([
    ['25000',25000],
    ['25000.0',25000],
    ['25,000',25000],
    ['KES 25,000',25000],
    ['',0],
    [undefined,0],
  ])('parses %s to a finite amount', (input,expected)=>{
    const amount=parseAmount(input);
    expect(Number.isFinite(amount)).toBe(true);
    expect(amount).toBe(expected);
  });
});
