import { Handshake, Megaphone, PenLine, UploadCloud } from 'lucide-react';
import { Stakeholder } from '../data';
import { ConfidenceBadge, SourceBadge } from './Badges';

type StakeholderLayerProps = {
  stakeholders: Stakeholder[];
};

export function StakeholderLayer({ stakeholders }: StakeholderLayerProps) {
  return (
    <section className="section" id="ecosystem">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Ecosystem Stakeholder Layer</p>
          <h2>Give advisors, governments, and providers a reason to improve the graph.</h2>
        </div>
        <div className="stakeholder-actions">
          <button><PenLine size={16} />Claim profile</button>
          <button><UploadCloud size={16} />Submit proof</button>
          <button><Megaphone size={16} />Receive demand</button>
        </div>
      </div>

      <div className="stakeholder-grid">
        {stakeholders.map((stakeholder) => (
          <article className="stakeholder-card" key={stakeholder.stakeholder_id}>
            <div className="stakeholder-head">
              <Handshake size={20} />
              <div>
                <h3>{stakeholder.name}</h3>
                <span>{stakeholder.category}</span>
              </div>
            </div>
            <p>{stakeholder.services}</p>
            <div className="proof-box">
              <span>Proof point</span>
              <strong>{stakeholder.proof_points}</strong>
            </div>
            <div className="proof-box">
              <span>Demand signal</span>
              <strong>{stakeholder.demand_signals_of_interest}</strong>
            </div>
            <div className="trust-row">
              <ConfidenceBadge score={stakeholder.confidence_score} />
              <SourceBadge ids={stakeholder.source_ids} urls={stakeholder.source_urls} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
