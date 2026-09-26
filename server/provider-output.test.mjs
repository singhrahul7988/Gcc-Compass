import test from 'node:test';
import assert from 'node:assert/strict';
import { providerOutput, providerRequest } from './ai-api.mjs';
import { researchSchema } from './research-contract.mjs';

test('Gemini thought parts cannot contaminate the final structured answer', () => {
  const output = providerOutput('gemini', { candidates: [{ finishReason: 'STOP', content: { parts: [{ thought: true, text: 'Thinking is not the JSON answer' }, { text: '{"title":"Answer"}' }] } }] });
  assert.deepEqual(JSON.parse(output), { title: 'Answer' });
});

test('all providers report output truncation instead of presenting malformed JSON as a validation error', () => {
  const responses = {
    gemini: { candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"title":' }] } }] },
    openai: { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output: [] },
    claude: { stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"title":' }] },
    deepseek: { choices: [{ finish_reason: 'length', message: { content: '{"title":' } }] },
  };
  for (const [provider, result] of Object.entries(responses)) {
    assert.throws(() => providerOutput(provider, result), error => error.code === 'OUTPUT_TRUNCATED' && Boolean(error.finishReason));
  }
});

test('blocked Gemini responses are actionable and never trigger a formatting repair', () => {
  assert.throws(() => providerOutput('gemini', { promptFeedback: { blockReason: 'SAFETY' } }), error => error.status === 422);
});

test('the reported Gemini 3.1 Flash Lite model receives JSON schema and the requested output budget', () => {
  const request = providerRequest('gemini', 'fixture-key', 'gemini-3.1-flash-lite', 'Research question', false, { schema: researchSchema, instructions: 'Use supplied evidence.', tokens: 12000, requireComparison: true });
  assert.match(request.url, /gemini-3\.1-flash-lite:generateContent$/);
  assert.equal(request.body.generationConfig.responseMimeType, 'application/json');
  assert.equal(request.body.generationConfig.maxOutputTokens, 12000);
  const schema = request.body.generationConfig.responseJsonSchema;
  assert.equal(schema.properties.sections.minItems, 2);
  assert.equal(schema.properties.comparison.anyOf.length, 1);
  assert.equal(schema.properties.comparison.anyOf[0].properties.rows.minItems, 3);
  assert.equal(researchSchema.properties.sections.minItems, undefined);
});
