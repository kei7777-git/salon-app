'use client';

import { useState } from 'react';
import AuthForm from './AuthForm';

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      {/* --- ヘッダー --- */}
      <header className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tighter">My Salon</h1>
          <button 
            onClick={() => setShowLogin(true)} 
            className="bg-black text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            ログイン / 登録
          </button>
        </div>
      </header>

      {/* --- ヒーローセクション --- */}
      <section className="pt-32 pb-20 px-6 text-center max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
          極上の癒やしを、<br className="hidden md:block"/>もっと身近に。
        </h2>
        <p className="text-gray-500 mb-10 text-lg md:text-xl leading-relaxed">
          24時間いつでも予約可能。<br/>
          あなただけの特別な時間を、ポイントでお得に体験しませんか？
        </p>
        <button 
          onClick={() => setShowLogin(true)}
          className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          今すぐ予約する
        </button>
      </section>

      {/* --- 特徴セクション --- */}
      <section className="py-20 bg-gray-50 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
          <div className="bg-white p-8 rounded-2xl shadow-sm">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="font-bold text-lg mb-2">24時間Web予約</h3>
            <p className="text-gray-500 text-sm">電話不要。空き状況を見ながら、いつでも好きな時に予約できます。</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="font-bold text-lg mb-2">ポイント制度</h3>
            <p className="text-gray-500 text-sm">あらかじめポイントを購入して利用。面倒な現金のやり取りは不要です。</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="font-bold text-lg mb-2">スマホで完結</h3>
            <p className="text-gray-500 text-sm">予約の確認、キャンセル、ポイント追加まで全てスマホひとつで。</p>
          </div>
        </div>
      </section>

      {/* --- フッター --- */}
      <footer className="py-8 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} My Salon App. All rights reserved.
      </footer>

      {/* --- ログインモーダル --- */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
            <button 
              onClick={() => setShowLogin(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
            >
              ✕
            </button>
            <div className="p-8">
              <h3 className="text-xl font-bold text-center mb-6">ログイン / 新規登録</h3>
              <AuthForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}