import { describe, it, expect } from 'vitest';
import { chunkDocument, cleanExtractedText } from '../src/services/search';
import { SourceDocument } from '../src/types';

describe('Document Chunking & Text Cleaning', () => {
  it('cleans HTML tags and collapses whitespace', () => {
    const raw = '<div class="content"><p>Hello <b>World</b>!</p>   <a href="https://example.com">Link</a></div>';
    const cleaned = cleanExtractedText(raw);
    expect(cleaned).toBe('Hello World! Link');
  });

  it('chunks a source document with accurate character offsets and chunk indices', () => {
    const text = 'This is sentence one. '.repeat(40); // approx 880 chars
    const doc: SourceDocument = {
      id: 'src_test_1',
      sessionId: 'sess_1',
      subQuestionId: 'subq_1',
      url: 'https://research.example.com/article',
      title: 'Test Article',
      domain: 'example.com',
      rawContent: text,
      chunkCount: 0,
      crawledAt: new Date().toISOString(),
    };

    const chunks = chunkDocument(doc, { chunkSize: 300, chunkOverlap: 50 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].id).toBe('src_test_1_chk_0');
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[0].charStart).toBe(0);
    expect(chunks[0].charEnd).toBeGreaterThan(150);
    expect(chunks[1].chunkIndex).toBe(1);
    expect(chunks[1].charStart).toBeLessThan(chunks[0].charEnd); // Validates overlap
  });

  it('handles empty document gracefully', () => {
    const doc: SourceDocument = {
      id: 'src_empty',
      sessionId: 'sess_1',
      subQuestionId: 'subq_1',
      url: 'https://example.com',
      title: 'Empty',
      domain: 'example.com',
      rawContent: '',
      chunkCount: 0,
      crawledAt: new Date().toISOString(),
    };

    const chunks = chunkDocument(doc);
    expect(chunks).toEqual([]);
  });
});
