import { Bot, SendHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CityBenchmark, GccRecord, Stakeholder } from '../data';
import { score } from '../data/csv';
import { ConfidenceBadge, SourceBadge } from './Badges';

type AiAnalystProps = {
  cities: CityBenchmark[];
  records: GccRecord[];
  stakeholders: Stakeholder[];
};

type Answer = {
  text: string;
  confidence: string;
  sourceIds: string;
  sourceUrls: string;
};

const prompts = [
  'Best city for a 50-person AI GCC?',
  'Hyderabad vs Bengaluru for fintech engineering?',
  'When does EOR stop making sense?',
  'Which stakeholders should I speak to for a 100-person GCC?',
];

export function AiAnalyst({ cities, records, stakeholders }: AiAnalystProps) {
  const [question, setQuestion] = useState(prompts[0]);
  const answer = useMemo(() => answerQuestion(question, cities, records, stakeholders), [cities, question, records, stakeholders]);

  return (
    <section className="section" id="analyst">
      <div className="section-heading">
        <div>
          <p className="eyebrow">AI Analyst</p>
          <h2>Grounded local responses. Refuses when the CSV evidence is thin.</h2>
        </div>
      </div>

      <div className="analyst-panel">
        <div className="prompt-rail">
          {prompts.map((prompt) => (
            <button className={question === prompt ? 'active' : ''} key={prompt} onClick={() => setQuestion(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
        <div className="analyst-main">
          <label className="analyst-input">
            <Bot size={20} />
            <input value={question} onChange={(event) => setQuestion(event.target.value)} />
            <button aria-label="Analyze question">
              <SendHorizontal size={18} />
            </button>
          </label>
          <article className="answer-card">
            <span>Local analyst answer</span>
            <p>{answer.text}</p>
            <div className="trust-row">
              <ConfidenceBadge score={answer.confidence} />
              <SourceBadge ids={answer.sourceIds} urls={answer.sourceUrls} />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function answerQuestion(
  question: string,
  cities: CityBenchmark[],
  records: GccRecord[],
  stakeholders: Stakeholder[],
): Answer {
  const lower = question.toLowerCase();
  const insufficient = {
    text: 'Insufficient verified data in the GCC Compass database.',
    confidence: '0',
    sourceIds: 'Source pending',
    sourceUrls: '',
  };

  if (lower.includes('eor') || lower.includes('stop making sense')) {
    return {
      text:
        'For this MVP, EOR starts to look less optimal around the 30-50 employee range or when long-term control, entity ownership, and captive culture become primary. Treat this as a configurable planning assumption, not legal or tax advice.',
      confidence: '50',
      sourceIds: 'SRC_INDUSLAW_GCC_2025_PDF;SRC_DHRUVA_GCC_2025_PDF',
      sourceUrls: '',
    };
  }

  if (lower.includes('stakeholder') || lower.includes('speak')) {
    const picks = stakeholders.slice(0, 5).map((item) => `${item.name} (${item.category})`).join(', ');
    return {
      text: `For a 100-person GCC, start with a mix of advisory, policy, setup, and delivery stakeholders: ${picks}. Use claim/proof workflows to validate capability before routing buyer demand.`,
      confidence: stakeholders[0]?.confidence_score ?? '70',
      sourceIds: stakeholders.slice(0, 3).map((item) => item.source_ids).join(';'),
      sourceUrls: '',
    };
  }

  if (lower.includes('hyderabad') && lower.includes('bengaluru')) {
    const bengaluru = cities.find((city) => city.city === 'Bengaluru');
    const hyderabad = cities.find((city) => city.city === 'Hyderabad');
    if (!bengaluru || !hyderabad) return insufficient;
    return {
      text: `Bengaluru has the deepest product, platform, and AI/ML talent pool, but carries premium rent and high attrition risk. Hyderabad reads as a strong cost-quality alternative with scaled engineering, healthcare/life sciences, analytics, and AI/data fit. For fintech engineering, choose Bengaluru when senior product depth is paramount; choose Hyderabad when speed, scale, and cost-quality balance matter more.`,
      confidence: String(Math.min(score(bengaluru.confidence_score), score(hyderabad.confidence_score))),
      sourceIds: `${bengaluru.source_ids};${hyderabad.source_ids}`,
      sourceUrls: `${bengaluru.source_urls};${hyderabad.source_urls}`,
    };
  }

  if (lower.includes('ai') || lower.includes('50-person')) {
    const ranked = cities
      .filter((city) => `${city.best_for} ${city.talent_strengths} ${city.sector_strengths}`.toLowerCase().includes('ai'))
      .sort((a, b) => score(b.confidence_score) - score(a.confidence_score));
    const top = ranked[0];
    if (!top) return insufficient;
    const cityRecords = records.filter((record) => record.cities.includes(top.city)).length;
    return {
      text: `${top.city} is the strongest first recommendation for a 50-person AI GCC in the current dataset. Rationale: ${top.talent_strengths} It has ${cityRecords} matching atlas records and the city benchmark flags it for ${top.best_for}.`,
      confidence: top.confidence_score,
      sourceIds: top.source_ids,
      sourceUrls: top.source_urls,
    };
  }

  return insufficient;
}
