import { CheckCircle2, CircleHelp, ShieldCheck } from 'lucide-react';

type ConfidenceBadgeProps = {
  score: string | number;
};

export function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  const numeric = typeof score === 'number' ? score : Number.parseInt(score, 10);
  const safeScore = Number.isFinite(numeric) ? numeric : 0;
  const tone = safeScore >= 85 ? 'high' : safeScore >= 70 ? 'medium' : 'low';

  return (
    <span className={`confidence ${tone}`}>
      <ShieldCheck size={14} />
      {safeScore || 'NA'} confidence
    </span>
  );
}

type SourceBadgeProps = {
  ids?: string;
  urls?: string;
};

export function SourceBadge({ ids = '', urls = '' }: SourceBadgeProps) {
  const firstId = ids.split(';').map((item) => item.trim()).find(Boolean) ?? 'Source pending';
  const firstUrl = urls.split(';').map((item) => item.trim()).find(Boolean);
  const external = firstUrl && firstUrl.startsWith('http');

  if (external) {
    return (
      <a className="source-badge" href={firstUrl} target="_blank" rel="noreferrer">
        <CheckCircle2 size={14} />
        {firstId}
      </a>
    );
  }

  return (
    <span className="source-badge">
      <CircleHelp size={14} />
      {firstId}
    </span>
  );
}
