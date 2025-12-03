/**
 * PHASE 2: Citation Generator
 *
 * Generates citations in multiple academic formats
 */

export interface CitationData {
  title: string;
  author?: string;
  date?: Date | string;
  url?: string;
  accessDate?: Date;
  archiveName?: string;
  itemType?: string;
  publisher?: string;
}

/**
 * Format author name for citation
 */
function formatAuthor(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];

  const lastName = parts[parts.length - 1];
  const firstNames = parts.slice(0, -1).join(' ');
  return `${lastName}, ${firstNames}`;
}

/**
 * Format date for citation
 */
function formatDate(date: Date | string, format: 'year' | 'full' = 'year'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'year') {
    return d.getFullYear().toString();
  }

  // Full format: Month Day, Year
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate APA 7th Edition citation
 */
export function generateAPA(data: CitationData): string {
  const parts: string[] = [];

  // Author
  if (data.author) {
    parts.push(`${formatAuthor(data.author)}.`);
  }

  // Year
  if (data.date) {
    parts.push(`(${formatDate(data.date, 'year')}).`);
  } else {
    parts.push('(n.d.).');
  }

  // Title (italicized in practice)
  parts.push(`${data.title}.`);

  // Archive/Publisher
  if (data.archiveName) {
    parts.push(`[${data.itemType || 'Archive item'}]. ${data.archiveName}.`);
  }

  // URL and access date
  if (data.url) {
    const accessDate = data.accessDate ? formatDate(data.accessDate, 'full') : formatDate(new Date(), 'full');
    parts.push(`Retrieved ${accessDate}, from ${data.url}`);
  }

  return parts.join(' ');
}

/**
 * Generate MLA 9th Edition citation
 */
export function generateMLA(data: CitationData): string {
  const parts: string[] = [];

  // Author
  if (data.author) {
    parts.push(`${formatAuthor(data.author)}.`);
  }

  // Title (quotes for shorter works, italics for longer)
  parts.push(`"${data.title}."`);

  // Container/Archive
  if (data.archiveName) {
    parts.push(`${data.archiveName},`);
  }

  // Date
  if (data.date) {
    parts.push(`${formatDate(data.date, 'full')}.`);
  }

  // URL and access date
  if (data.url) {
    parts.push(`${data.url}.`);
    const accessDate = data.accessDate ? formatDate(data.accessDate, 'full') : formatDate(new Date(), 'full');
    parts.push(`Accessed ${accessDate}.`);
  }

  return parts.join(' ');
}

/**
 * Generate Chicago 17th Edition citation (Notes and Bibliography)
 */
export function generateChicago(data: CitationData): string {
  const parts: string[] = [];

  // Author
  if (data.author) {
    // Chicago uses first name first in bibliography
    parts.push(`${data.author}.`);
  }

  // Title (italicized or quoted depending on type)
  parts.push(`"${data.title}."`);

  // Archive information
  if (data.archiveName) {
    parts.push(`${data.archiveName}.`);
  }

  // Date
  if (data.date) {
    parts.push(`${formatDate(data.date, 'year')}.`);
  }

  // URL
  if (data.url) {
    parts.push(data.url + '.');
  }

  return parts.join(' ');
}

/**
 * Generate BibTeX citation for LaTeX documents
 */
export function generateBibTeX(data: CitationData, citeKey?: string): string {
  const key = citeKey || `${data.author?.split(' ')[0] || 'Anonymous'}${data.date ? formatDate(data.date, 'year') : 'nd'}`;

  const fields: string[] = [];

  if (data.author) {
    fields.push(`  author = {${data.author}}`);
  }

  fields.push(`  title = {${data.title}}`);

  if (data.date) {
    fields.push(`  year = {${formatDate(data.date, 'year')}}`);
  }

  if (data.archiveName) {
    fields.push(`  howpublished = {${data.archiveName}}`);
  }

  if (data.url) {
    fields.push(`  url = {${data.url}}`);
  }

  const accessDate = data.accessDate ? formatDate(data.accessDate, 'full') : formatDate(new Date(), 'full');
  fields.push(`  note = {Accessed: ${accessDate}}`);

  return `@misc{${key},\n${fields.join(',\n')}\n}`;
}

/**
 * Generate plain text citation (simple format)
 */
export function generatePlainText(data: CitationData): string {
  const parts: string[] = [];

  parts.push(data.title);

  if (data.author) {
    parts.push(`by ${data.author}`);
  }

  if (data.date) {
    parts.push(`(${formatDate(data.date, 'year')})`);
  }

  if (data.archiveName) {
    parts.push(`- ${data.archiveName}`);
  }

  if (data.url) {
    parts.push(`Available at: ${data.url}`);
  }

  return parts.join(' ');
}

/**
 * Generate all citation formats
 */
export function generateAllCitations(data: CitationData): Record<string, string> {
  return {
    apa: generateAPA(data),
    mla: generateMLA(data),
    chicago: generateChicago(data),
    bibtex: generateBibTeX(data),
    plaintext: generatePlainText(data),
  };
}
