import { vi } from 'vitest';

export const useRouter = vi.fn(() => ({ refresh: vi.fn(), push: vi.fn() }));
export const usePathname = vi.fn(() => '/');
export const useSearchParams = vi.fn(() => new URLSearchParams());
export const useParams = vi.fn(() => ({}));
export const notFound = vi.fn();
export const redirect = vi.fn();
