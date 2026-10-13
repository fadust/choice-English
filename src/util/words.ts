const segmenter = new Intl.Segmenter('en', { granularity: 'word' });

export function wordCount(text: string): number {
  return [...segmenter.segment(text)].filter(part => part.isWordLike).length;
}

export function truncateWords(text: string, maximum: number): string {
  if (maximum <= 0) return '';
  const words = [...segmenter.segment(text)].filter(part => part.isWordLike);
  return words.length > maximum ? text.slice(0, words[maximum].index).trimEnd() : text;
}
