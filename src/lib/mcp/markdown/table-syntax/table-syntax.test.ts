import { describe, expect, it } from 'vitest';

import { tableSyntaxHelp, validateTableSyntax } from '.';

describe('validateTableSyntax', () => {
  it('通常の GFM table は素通しする', () => {
    expect(validateTableSyntax(['| A | B |', '| --- | --- |', '| 1 | 2 |'].join('\n'))).toEqual([]);
  });

  it('セル内の \\| を回復ヒント付きで reject する(該当行を引用)', () => {
    const [error] = validateTableSyntax('| a \\| b | c |');
    expect(error).toContain('\\|');
    expect(error).toContain('該当行: | a \\| b | c |');
    expect(error).toContain('admin');
  });

  it('配置指定つき divider(:---)を reject する', () => {
    const [error] = validateTableSyntax(['| A | B |', '| :--- | ---: |', '| 1 | 2 |'].join('\n'));
    expect(error).toContain('該当行: | :--- | ---: |');
    expect(error).toContain('---');
    expect(error).toContain('admin');
  });

  it('セル内の literal \\n を reject する(import で space に潰れて往復不能 — Task 1 で確認済み)', () => {
    const [error] = validateTableSyntax('| a\\nb | c |');
    expect(error).toContain('\\n');
    expect(error).toContain('該当行: | a\\nb | c |');
    expect(error).toContain('admin');
  });

  it('コードフェンス内の table 風テキストは検証しない', () => {
    expect(validateTableSyntax(['```', '| a \\| b |', '| :--- |', '```'].join('\n'))).toEqual([]);
  });

  it('table 行以外の \\| は対象外(通常段落)', () => {
    expect(validateTableSyntax('普通の文中の \\| は表ではない')).toEqual([]);
  });

  it('複数違反はすべて列挙する', () => {
    const errors = validateTableSyntax(['| a \\| b |', '| :--- |'].join('\n'));
    expect(errors).toHaveLength(2);
  });
});

describe('tableSyntaxHelp', () => {
  it('制約(セル内 | 不可・配置指定不可・セル内改行不可)を説明している', () => {
    expect(tableSyntaxHelp).toContain('|');
    expect(tableSyntaxHelp).toContain(':---');
    expect(tableSyntaxHelp).toContain('改行');
  });
});
