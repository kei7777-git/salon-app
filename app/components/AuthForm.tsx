'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true); // true=ログイン, false=新規登録
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        // --- ログイン処理 ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // ログイン成功したらリロード
        window.location.reload();
      } else {
        // --- 新規登録処理 ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('確認メールを送信しました。メール内のリンクをクリックしてください。');
      }
    } catch (error: any) {
      setMessage('エラー: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* --- タブ切り替え（ログイン vs 新規登録） --- */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          type="button"
          onClick={() => { setIsLogin(true); setMessage(''); }}
          className={`flex-1 pb-3 text-lg font-bold transition-colors ${
            isLogin
              ? 'border-b-4 border-blue-600 text-blue-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          ログイン
        </button>
        <button
          type="button"
          onClick={() => { setIsLogin(false); setMessage(''); }}
          className={`flex-1 pb-3 text-lg font-bold transition-colors ${
            !isLogin
              ? 'border-b-4 border-green-500 text-green-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          新規登録
        </button>
      </div>

      <form onSubmit={handleAuth} className="flex flex-col gap-6">
        
        {/* メールアドレス入力 */}
        <div>
          <label className="block text-gray-900 font-bold mb-2 text-sm">
            メールアドレス
          </label>
          <input
            type="email"
            required
            placeholder="例: user@example.com"
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* パスワード入力 */}
        <div>
          <label className="block text-gray-900 font-bold mb-2 text-sm">
            パスワード
          </label>
          <input
            type="password"
            required
            placeholder="6文字以上の英数字"
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* メッセージ表示エリア */}
        {message && (
          <div className={`p-4 rounded-lg text-sm font-bold ${
            message.includes('エラー') 
              ? 'bg-red-50 text-red-600 border border-red-100' 
              : 'bg-blue-50 text-blue-600 border border-blue-100'
          }`}>
            {message}
          </div>
        )}

        {/* アクションボタン */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 mt-2 rounded-full text-white font-bold text-lg shadow-md transition-transform active:scale-95 ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : isLogin 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                : 'bg-green-500 hover:bg-green-600 shadow-green-200'
          }`}
        >
          {loading ? '処理中...' : isLogin ? 'ログインする' : '新規登録する'}
        </button>

      </form>
    </div>
  );
}