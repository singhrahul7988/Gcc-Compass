import test from 'node:test';
import assert from 'node:assert/strict';
import { searchLocal } from './local-search.mjs';

test('local search ranks specific city, state, company and policy evidence', () => {
  const city = searchLocal('electricity prices in Chennai');
  assert.equal(city.results[0]?.title, 'Chennai');
  const company = searchLocal('Microsoft GCC Hyderabad');
  assert.equal(company.results.some(item => item.title === 'Microsoft'), true);
  assert.equal(company.results.some(item => item.title === 'Hyderabad'), true);
  const policy = searchLocal('Telangana policy incentives');
  assert.equal(policy.results.some(item => item.title === 'Hyderabad'), true);
  assert.equal(policy.results.some(item => item.kind === 'policy' && item.title.includes('Gujarat')), false);
  for (const result of [...city.results, ...company.results, ...policy.results]) {
    assert.equal(result.type, 'local');
    assert.ok(result.number > 0);
    assert.ok(result.title);
  }
});

