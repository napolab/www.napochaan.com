type RemotePattern = {
  protocol?: string;
  hostname: string;
  port?: string | number;
  pathname?: string;
};

type NextImageConfig = {
  remotePatterns?: RemotePattern[];
};

/**
 * Next.jsのremotePatternsに基づいてURLを検証するarrow関数
 */
export const isAllowedImageUrl = (url: string, origin: string, nextImageConfig: NextImageConfig): boolean => {
  try {
    // 絶対URLかどうかをチェック（プロトコルで始まるか）
    const isAbsoluteUrl = /^https?:\/\//.test(url);

    // 相対URLの場合のみbaseを使用、絶対URLの場合はそのまま解析
    const parsedUrl = isAbsoluteUrl ? new URL(url) : new URL(url, origin);

    // 内部URLは常に許可
    if (parsedUrl.origin === origin) {
      return true;
    }

    // remotePatternに一致するかチェック
    return (nextImageConfig.remotePatterns ?? []).some((pattern) => {
      // hostnameチェック（必須）
      if (pattern.hostname !== parsedUrl.hostname) {
        return false;
      }

      // protocolチェック（オプション）
      if (pattern.protocol && pattern.protocol !== parsedUrl.protocol.slice(0, -1)) {
        return false;
      }

      // portチェック（オプション）
      // patternにportが指定されており、かつ空文字でない場合のみチェック
      if (pattern.port !== undefined && pattern.port !== "" && pattern.port !== null) {
        // デフォルトポート（HTTP: 80, HTTPS: 443）の場合、parsedUrl.portは空文字になる
        const actualPort = parsedUrl.port || (parsedUrl.protocol === "https:" ? "443" : "80");
        if (pattern.port.toString() !== actualPort) {
          return false;
        }
      }

      // pathnameチェック（オプション、glob patternサポート）
      if (pattern.pathname !== undefined) {
        const pathRegex = new RegExp(
          pattern.pathname.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, "."),
        );
        if (!pathRegex.test(parsedUrl.pathname)) {
          return false;
        }
      }

      return true;
    });
  } catch {
    return false;
  }
};
