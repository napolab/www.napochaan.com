// OAuthProvider(worker.ts)と frame guard(middleware/frame-guard.ts)が共有する同意画面のパス。
// worker.ts は build 生成物(.open-next/worker.js)を import するのでテストから読めない。値はここに置く。
export const OAUTH_AUTHORIZE_PATH = '/oauth/authorize';
