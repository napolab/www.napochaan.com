import { describe, expect, it } from 'vitest';

import { codeMcpSupport } from '.';

const FENCE = ['```typescript', 'const x = 1;', '```'].join('\n');
const IMAGE_ROW_FENCE = ['```image-row', '![media:79](left)', '![media:78]()', '```'].join('\n');

describe('codeMcpSupport.blockType', () => {
  it('is "Code" (the premade block slug)', () => {
    expect(codeMcpSupport.blockType).toBe('Code');
  });
});

describe('codeMcpSupport.stripFences', () => {
  it('removes a language-tagged fence entirely', () => {
    const md = `intro\n\n${FENCE}\n\noutro`;
    const stripped = codeMcpSupport.stripFences(md);
    expect(stripped).toContain('intro');
    expect(stripped).toContain('outro');
    expect(stripped).not.toContain('const x = 1;');
  });

  it('removes a plain ``` fence without a language', () => {
    const md = ['```', '![alt](https://example.com/x.png)', '```'].join('\n');
    expect(codeMcpSupport.stripFences(md)).not.toContain('example.com');
  });

  it("leaves other blocks' fences (```image-row) untouched", () => {
    const md = `before\n\n${IMAGE_ROW_FENCE}\n\nafter`;
    const stripped = codeMcpSupport.stripFences(md);
    expect(stripped).toContain('![media:79](left)');
    expect(stripped).toContain('before');
    expect(stripped).toContain('after');
  });

  it('leaves fence-free content untouched', () => {
    expect(codeMcpSupport.stripFences('# hi\n\npara')).toBe('# hi\n\npara');
  });
});

describe('codeMcpSupport.validateFences', () => {
  it('accepts a balanced fence with a supported language key', () => {
    expect(codeMcpSupport.validateFences(FENCE)).toEqual([]);
  });

  it('accepts a balanced fence without a language key', () => {
    expect(codeMcpSupport.validateFences('```\nplain\n```')).toEqual([]);
  });

  it('accepts every supported language key', () => {
    for (const lang of ['typescript', 'tsx', 'css', 'json', 'bash']) {
      expect(codeMcpSupport.validateFences(`\`\`\`${lang}\ncode\n\`\`\``)).toEqual([]);
    }
  });

  it('flags an unsupported language key with a recovery hint listing valid keys', () => {
    const errors = codeMcpSupport.validateFences('```python\nprint(1)\n```');
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('python');
    expect(errors[0]).toContain('typescript / tsx / css / json / bash');
  });

  it('does not treat an image-row fence as a code fence', () => {
    expect(codeMcpSupport.validateFences(IMAGE_ROW_FENCE)).toEqual([]);
  });

  it('validates each fence even when fences are adjacent (merged fence segment)', () => {
    const md = ['```bash', 'echo hi', '```', '```ruby', 'puts 1', '```'].join('\n');
    const errors = codeMcpSupport.validateFences(md);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('ruby');
  });

  it('accepts a doc with no fences', () => {
    expect(codeMcpSupport.validateFences('# hi\n\npara')).toEqual([]);
  });
});

describe('codeMcpSupport.extractMediaIDs', () => {
  it('never reports media ids (even for image syntax inside a fence)', () => {
    const md = ['```md', '![media:5](x)', '```'].join('\n');
    expect(codeMcpSupport.extractMediaIDs(md)).toEqual([]);
  });
});

describe('codeMcpSupport.syntaxHelp', () => {
  it('documents the standard fence syntax and the supported language keys', () => {
    expect(codeMcpSupport.syntaxHelp).toContain('```typescript');
    expect(codeMcpSupport.syntaxHelp).toContain('typescript / tsx / css / json / bash');
  });
});
