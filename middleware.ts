import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/admin/:path*'], // /admin 以下のページのみ対象にする
};

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    // Base64デコードして "user:password" の形式を取り出す
    const [user, pwd] = atob(authValue).split(':');

    // 環境変数に設定したID・パスワードと一致するか確認
    if (user === process.env.ADMIN_USER && pwd === process.env.ADMIN_PASSWORD) {
      return NextResponse.next();
    }
  }

  // 一致しない（または未入力）の場合は認証画面を出す
  return new NextResponse('Auth Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}