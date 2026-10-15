import { APIError } from 'payload';
import { describe, expect, test } from 'vitest';

import { PasswordWriteForbidden, rejectPasswordWrites } from './index';

describe('rejectPasswordWrites', () => {
  // Payload 3.84.1 は updateByID も bulk update も `operation: 'update'` で beforeOperation を呼ぶ
  // (collections/operations/utilities/types.js の operationToHookOperation)。
  test.each(['create', 'update'])('rejects a %s that carries a password', (operation) => {
    expect(() => rejectPasswordWrites({ operation, args: { data: { email: 'a@example.com', password: 'secret' } } })).toThrow(PasswordWriteForbidden);
  });

  test.each([undefined, null, ''])('rejects a password key whatever its value (%j)', (password) => {
    expect(() => rejectPasswordWrites({ operation: 'update', args: { data: { password } } })).toThrow(PasswordWriteForbidden);
  });

  test('surfaces as a public 403 with an actionable message', () => {
    expect(() => rejectPasswordWrites({ operation: 'update', args: { data: { password: 'secret' } } })).toThrow(
      expect.objectContaining({ status: 403, isPublic: true, message: 'Cloudflare Access 有効時はパスワードを設定できません' }),
    );
  });

  test('is a Payload APIError so the REST handler returns its status', () => {
    expect(new PasswordWriteForbidden()).toBeInstanceOf(APIError);
  });

  test.each(['create', 'update'])('passes a %s without a password through', (operation) => {
    expect(rejectPasswordWrites({ operation, args: { data: { email: 'a@example.com', name: 'a' } } })).toBeUndefined();
  });

  test('ignores an inherited password key', () => {
    const data: object = Object.create({ password: 'inherited' });

    expect(rejectPasswordWrites({ operation: 'update', args: { data } })).toBeUndefined();
  });

  test.each(['read', 'delete', 'count', 'login'])('ignores the %s operation', (operation) => {
    expect(rejectPasswordWrites({ operation, args: { data: { password: 'secret' } } })).toBeUndefined();
  });

  test('ignores operations without data', () => {
    expect(rejectPasswordWrites({ operation: 'update', args: {} })).toBeUndefined();
  });
});
