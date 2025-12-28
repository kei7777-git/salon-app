'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ログイン処理
  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    else window.location.reload(); // ログインできたら画面を更新
    setLoading(false);
  };

  // 新規登録処理
  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) alert(error.message);
    else {
      alert('登録完了！自動でログインします');
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div className="flex gap-2">
      <input
        type="email"
        placeholder="メアド"
        className="border p-2 rounded text-sm"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="パスワード"
        className="border p-2 rounded text-sm"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button 
        onClick={handleLogin}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
      >
        {loading ? '...' : 'ログイン'}
      </button>
      <button 
        onClick={handleSignUp}
        disabled={loading}
        className="bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm hover:bg-gray-300"
      >
        登録
      </button>
    </div>
  );
}