import { NextRequest, NextResponse } from 'next/server';

// 設定（matcher）を削除して、全ページで強制発動させる
export function middleware(req: NextRequest) {
  // 画面に「Middleware is Working!」とだけ表示して強制終了する
  return new NextResponse('Middleware is Working! (Test)', { status: 200 });
}