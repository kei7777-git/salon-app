import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 設定(matcher)を削除しました。これで全ページで発動します。
export function middleware(request: NextRequest) {
  // 画面に「ALIVE」と表示して強制終了
  return new NextResponse('MIDDLEWARE IS ALIVE!', { status: 200 });
}