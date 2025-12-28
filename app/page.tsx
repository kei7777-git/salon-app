'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import AuthForm from "./components/AuthForm";
import CourseCard from "./components/CourseCard";
import ReservationList from "./components/ReservationList";
import ProfileEdit from "./components/ProfileEdit"; // 追加

type Course = {
  id: string;
  title: string;
  description: string;
  price_points: number;
  duration_minutes: number;
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [points, setPoints] = useState<number>(0);
  const [displayName, setDisplayName] = useState<string>(''); // 名前保存用
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // データ読み込み関数
  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;
    setUser(currentUser ?? null);

    if (currentUser) {
      // ポイントと名前(display_name)を取得
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_points, display_name')
        .eq('id', currentUser.id)
        .single();
      
      setPoints(profile?.current_points ?? 0);
      setDisplayName(profile?.display_name ?? '');
    }

    const { data } = await supabase.from("courses").select("*");
    if (data) setCourses(data);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchData();
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex justify-center items-center">読み込み中...</div>;

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            サロン予約メニュー
          </h1>
          <div>
            {user ? (
              <div className="text-right">
                {/* 名前があれば名前を表示、なければメアドを表示 */}
                <div className="text-sm text-gray-500 mb-1">
                  ようこそ、
                  <span className="font-bold text-gray-800 ml-1">
                    {displayName || user.email}
                  </span> さん
                </div>
                <div className="text-xl font-bold text-blue-600">
                  所持ポイント: {points.toLocaleString()} pt
                </div>
              </div>
            ) : (
              <AuthForm />
            )}
          </div>
        </div>

        {/* コース一覧 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {courses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              userId={user?.id}
              userPoints={points}
              onReserveComplete={fetchData} 
            />
          ))}
        </div>

        {/* マイページエリア */}
        {user && (
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">マイページ</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* 左側：予約リスト */}
              <div className="space-y-6">
                 <ReservationList userId={user.id} />
              </div>
              
              {/* 右側：プロフィール設定 */}
              <div>
                <ProfileEdit 
                  userId={user.id} 
                  initialName={displayName} 
                  onUpdate={fetchData} 
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}