import { describe, it, expect } from 'vitest';
import { OPERATIONS, PLANS, ERROR_CODES } from '../packages/shared/src';

describe('Operations & Plan Registry', () => {
  it('should define credit costs for all 10 core operations', () => {
    expect(OPERATIONS['render/screenshot'].credits).toBe(1);
    expect(OPERATIONS['render/pdf'].credits).toBe(3);
    expect(OPERATIONS['extract/text'].credits).toBe(2);
    expect(OPERATIONS['extract/markdown'].credits).toBe(2);
    expect(OPERATIONS['extract/json'].credits).toBe(5);
    expect(OPERATIONS['inspect'].credits).toBe(1);
    expect(OPERATIONS['analyze'].credits).toBe(3);
    expect(OPERATIONS['compare'].credits).toBe(5);
    expect(OPERATIONS['convert/pdf'].credits).toBe(3);
    expect(OPERATIONS['convert/docx'].credits).toBe(5);
  });

  it('should configure sensible plan tiers', () => {
    expect(PLANS.free.monthlyCredits).toBe(500);
    expect(PLANS.starter.monthlyCredits).toBe(10000);
    expect(PLANS.growth.monthlyCredits).toBe(50000);
    expect(PLANS.enterprise.monthlyCredits).toBe(250000);

    expect(PLANS.free.rateLimitRpm).toBe(30);
    expect(PLANS.starter.rateLimitRpm).toBe(120);
    expect(PLANS.growth.rateLimitRpm).toBe(300);
    expect(PLANS.enterprise.rateLimitRpm).toBe(1200);
  });

  it('should specify standard error codes', () => {
    expect(ERROR_CODES.INVALID_API_KEY).toBe('INVALID_API_KEY');
    expect(ERROR_CODES.URL_BLOCKED).toBe('URL_BLOCKED');
    expect(ERROR_CODES.RATE_LIMITED).toBe('RATE_LIMITED');
    expect(ERROR_CODES.QUOTA_EXCEEDED).toBe('QUOTA_EXCEEDED');
  });
});
