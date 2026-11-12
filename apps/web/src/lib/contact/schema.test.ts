import { describe, it, expect } from 'vitest';

import { contactSchema } from './schema';

const validInput = {
  name: 'なぽちゃん',
  email: 'user@example.com',
  message: 'これは十分に長い本文です。',
} as const;

const messagesOf = (input: unknown): string[] => {
  const result = contactSchema.safeParse(input);
  if (result.success) return [];

  return result.error.issues.map((issue) => issue.message);
};

describe('contactSchema', () => {
  it('accepts a valid input', () => {
    const result = contactSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  describe('name', () => {
    it('rejects an empty name with the expected message', () => {
      const messages = messagesOf({ ...validInput, name: '' });
      expect(messages).toContain('お名前を入力してください');
    });

    it('rejects a name longer than 100 characters with the expected message', () => {
      const messages = messagesOf({ ...validInput, name: 'あ'.repeat(101) });
      expect(messages).toContain('お名前は100文字以内で入力してください');
    });

    it('accepts a name of exactly 100 characters', () => {
      const result = contactSchema.safeParse({ ...validInput, name: 'あ'.repeat(100) });
      expect(result.success).toBe(true);
    });
  });

  describe('email', () => {
    it('rejects a malformed email with the expected message', () => {
      const messages = messagesOf({ ...validInput, email: 'nope' });
      expect(messages).toContain('正しいメールアドレスを入力してください');
    });

    it('accepts a valid email', () => {
      const result = contactSchema.safeParse({ ...validInput, email: 'test@example.com' });
      expect(result.success).toBe(true);
    });
  });

  describe('message', () => {
    it('rejects a message shorter than 10 characters with the expected message', () => {
      const messages = messagesOf({ ...validInput, message: 'あ'.repeat(9) });
      expect(messages).toContain('本文は10文字以上で入力してください');
    });

    it('accepts a message of exactly 10 characters', () => {
      const result = contactSchema.safeParse({ ...validInput, message: 'あ'.repeat(10) });
      expect(result.success).toBe(true);
    });

    it('rejects a message longer than 5000 characters with the expected message', () => {
      const messages = messagesOf({ ...validInput, message: 'あ'.repeat(5001) });
      expect(messages).toContain('本文は5000文字以内で入力してください');
    });
  });
});
