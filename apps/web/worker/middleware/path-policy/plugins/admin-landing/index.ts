import { when } from '../../../../lib/first-match-runner';
import { allOf } from '../../../../lib/predicate';
import { redirectTo } from '../../actions';
import { isDescendantOf } from '../../../../lib/path-predicate';
import { byPathname, isCrossSiteNavigation } from '../../predicates/request';

import type { PathPolicyPlugin } from '../../types';

const ADMIN_ROOT = '/admin';

// Payload の cloudflare-access strategy は、Origin の無いクロスサイトのトップレベル遷移を認証する
// (Access ログイン直後の着地は IdP 経由の cross-site リダイレクトなので、拒否すると誰もログインできない)。
// strategy は headers しか受け取らずパスを見られないので、着地先の制限はここで掛ける: 他サイトからの遷移は
// `/admin` だけを描画させ、それより深い admin ページ(GET の描画で autosave の下書きや一覧の preference を
// 書き込む画面)は `/admin` へ送る。`/admin` と `/admin/` は着地先そのものなので対象外(isDescendantOf が除く)。
// 302 は fetch metadata 次第で変わるので、エッジにもブラウザにも保存させない。
export const adminLandingPlugin: PathPolicyPlugin = when(allOf(isCrossSiteNavigation, byPathname(isDescendantOf(ADMIN_ROOT))), () => redirectTo(ADMIN_ROOT));
