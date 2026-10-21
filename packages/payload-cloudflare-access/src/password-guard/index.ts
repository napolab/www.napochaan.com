import { APIError } from 'payload';

// errors/ は import を持たない module のまま保つ(verify などが workerd でも読み込めるように)。Payload の
// runtime に依存するこの error は、それを投げる hook と同じ module に置く。
// Payload の REST はこの status と message をそのまま返す(APIError は 500 以外なら isPublic)。
export class PasswordWriteForbidden extends APIError {
  override readonly name = 'PasswordWriteForbidden';

  constructor() {
    super('Cloudflare Access 有効時はパスワードを設定できません', 403);
  }
}

// Payload 3.84.1 は create を 'create'、updateByID と bulk update をどちらも 'update' として beforeOperation に渡す
// (collections/operations/utilities/types.js の operationToHookOperation)。forgotPassword / resetPassword は
// disableLocalStrategy の間 Payload 自身が Forbidden にするので、ここで見るのは create / update だけ。
const PASSWORD_WRITE_OPERATIONS: readonly string[] = ['create', 'update'];

// BeforeOperationArg のうち、この hook が読むのは operation と args.data だけ。最小の形で受けることで、
// CollectionBeforeOperationHook として登録でき、テストからも Payload の req を組まずに呼べる。
// args は operation ごとに形が違う(find の args は data を持たない)ので object で受け、`in` で絞る。
export type PasswordWriteArg = { operation: string; args: object };

const hasOwnPassword = (args: object): boolean => {
  if (!('data' in args)) return false;
  const { data } = args;

  return typeof data === 'object' && data !== null && Object.hasOwn(data, 'password');
};

// enableFields で hash 列を残しているので、Payload は create / update の data.password を hash して保存する。
// その資格情報は Access を外した(切り戻した)瞬間に password ログインで使えてしまうので、書き込み自体を拒否する。
// beforeChange で消すのでは遅い: updateDocument は field hook より前に data.password を取り出している
// (collections/operations/utilities/update.js)。値は見ない。key があれば空文字でも拒否する。
export const rejectPasswordWrites = ({ operation, args }: PasswordWriteArg): void => {
  if (!PASSWORD_WRITE_OPERATIONS.includes(operation)) return;
  if (!hasOwnPassword(args)) return;

  throw new PasswordWriteForbidden();
};
