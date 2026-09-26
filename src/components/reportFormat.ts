import type { LiveAnalysis } from './aiClient';

export function reportParagraphs(text: string, wordsPerParagraph = 60): string[] {
  const paragraphs: string[] = [];
  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  for (const block of text.trim().split(/\n\s*\n/).filter(Boolean)) {
    let paragraph = '';
    for (const { segment } of segmenter.segment(block)) {
      if (paragraph && paragraph.trim().split(/\s+/).length >= wordsPerParagraph) {
        paragraphs.push(paragraph.trim());
        paragraph = '';
      }
      paragraph += segment;
    }
    if (paragraph.trim()) paragraphs.push(paragraph.trim());
  }
  return paragraphs;
}

// Move an exact, cited city bullet into its table cell once; keep every other explanation.
export function sectionsForReading(analysis: LiveAnalysis) {
  const references = (values: number[]) => [...values].sort((a, b) => a - b).join(',');
  const label = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
  return (analysis.sections || []).map(section => {
    const row = analysis.comparison?.rows.find(row => row.factor === section.title);
    if (!row) return section;
    return {
      ...section,
      bullets: section.bullets.filter(bullet => {
        const match = bullet.text.match(/^([^:]{2,70}):\s+([\s\S]+)$/);
        if (!match) return true;
        const index = analysis.comparison!.columns.findIndex(column => label(column) === label(match[1]));
        const cell = row.cells[index];
        return !cell || cell.text !== match[2].trim() || references(cell.citations) !== references(bullet.citations);
      }),
    };
  }).filter(section => section.paragraphs.length || section.bullets.length);
}
