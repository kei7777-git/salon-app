'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import CourseCard from './components/CourseCard';
import PointCharge from './components/PointCharge';
import ReservationList from './components/ReservationList';
import LandingPage from './components/LandingPage'; // LP読み込み

export default function Home() {
  // --- State ---
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);

  // 名前登録用State
  const [newName, setNewName] = useState('');
  const [isRegisteringName, setIsRegisteringName] = useState(false);

  // --- データ取得 ---
  useEffect(() => {
    let mounted = true;

    const getSessionAndProfile = async () => {
      // 1. セッション取得
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // 2. プロフィール取得
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setProfile(profile);

        // 3. コース取得
        const { data: courses } = await supabase.from('courses').select('*').order('created_at');
        if (courses) setCourses(courses);
      }
      
      if (mounted) setLoading(false);
    };

    getSessionAndProfile();

    // ログイン状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
      } else {
        // ログイン直後にもプロフィールを再取得
        getSessionAndProfile();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- アクション: ログアウト ---
  const handleLogout = async () => {
    if(!confirm('ログアウトしますか？')) return;
    await supabase.auth.signOut();
    window.location.reload();
  };

  // --- アクション: 初回名前登録 ---
  const handleRegisterName = async () => {
    if (!newName.trim()) return alert('名前を入力してください');
    setIsRegisteringName(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: newName })
        .eq('id', session.user.id);

      if (error) throw error;

      // 更新成功したら画面リロードしてダッシュボードへ
      window.location.reload();
    } catch (e: any) {
      alert('エラー: ' + e.message);
      setIsRegisteringName(false);
    }
  };

  // --- 表示分岐 ---

  // 1. ロード中
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin text-2xl">⏳</div></div>;
  }

  // 2. 未ログイン（LP表示）
  if (!session) {
    return <LandingPage />;
  }

  // 3. 名前未設定（名前登録画面）
  // ※ display_name が空の場合にここを表示
  if (profile && !profile.display_name) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">はじめまして！🎉</h2>
          <p className="text-gray-600 mb-6">
            予約に使用するお名前（ニックネーム可）を教えてください。
          </p>
          <input
            type="text"
            placeholder="例: 山田 花子"
            className="w-full border p-3 rounded-lg mb-4 text-lg"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            onClick={handleRegisterName}
            disabled={isRegisteringName}
            className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            {isRegisteringName ? '登録中...' : '登録して始める'}
          </button>
        </div>
      </div>
    );
  }

  // 4. ログイン済み & 名前設定済み（ダッシュボード）
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-bold text-lg">My Salon</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-blue-600">
              {profile?.current_points?.toLocaleString() || 0} pt
            </span>
            <button 
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 px-2 py-1 rounded"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-10">
        
        {/* ユーザー挨拶 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            こんにちは、{profile?.display_name} 様 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            今日はどのコースでリラックスしますか？
          </p>
        </div>

        {/* コース一覧 */}
        <section>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            💆‍♀️ コースを選択して予約
          </h3>
          <div className="space-y-4">
            {courses.length === 0 ? (
              <p className="text-gray-400 text-center py-4">コース準備中...</p>
            ) : (
              courses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  userId={session.user.id} 
                  userPoints={profile?.current_points || 0}
                  onReserveComplete={() => {
                    console.log("予約完了");
                  }}
                />
                
              ))
            )}
          </div>
        </section>

        {/* 予約リスト */}
        <ReservationList userId={session.user.id} />

        {/* ポイントチャージ */}
        <PointCharge userId={session.user.id} currentPoints={profile?.current_points || 0} />

      </main>
    </div>
  );
}