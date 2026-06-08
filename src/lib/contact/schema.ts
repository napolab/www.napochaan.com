import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(1, { message: 'お名前を入力してください' }).max(100, { message: 'お名前は100文字以内で入力してください' }),
  email: z.string().email({ message: '正しいメールアドレスを入力してください' }).max(254, { message: 'メールアドレスが長すぎます' }),
  message: z.string().trim().min(10, { message: '本文は10文字以上で入力してください' }).max(5000, { message: '本文は5000文字以内で入力してください' }),
});

export type ContactInput = z.infer<typeof contactSchema>;
