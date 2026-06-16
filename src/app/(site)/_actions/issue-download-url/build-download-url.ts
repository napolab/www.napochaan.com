type BuildDownloadURLInput = { releaseId: string; exp: number; sig: string };

// Build the gated download path. Use URLSearchParams so values are encoded once and
// the param order is stable (review feedback: build URLs structurally, not by hand).
export const buildDownloadURL = ({ releaseId, exp, sig }: BuildDownloadURLInput): string => {
  const params = new URLSearchParams({ releaseId, exp: `${exp}`, sig });
  return `/api/software/download?${params.toString()}`;
};
