'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';

type Props = {
  course: any;
  userId: string;
  userPoints: number;
  onReserveComplete?: () => void;
};

export default function CourseCard({ course, userId, userPoints, onReserveComplete }: Props) {
  const [loading, setLoading] = useState(false);

  const handleReserve = async () => {
    // ポイント不足チェック
    if (userPoints < course.points) {
      alert('ポイントが不足しています。チャージしてください。');
      return;
    }

    // 確認ダイアログ
    if (!confirm(`${course.title}を予約しますか？\n消費ポイント: ${course.points}pt`)) return;

    setLoading(true);
    try {
      // 1. ポイント消費
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ current_points: userPoints - course.points })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 2. 予約作成
      // 日時はデモ用として「現在時刻の1時間後」などを自動設定するか、
      // 本来は日付選択カレンダーが必要ですが、ここではシンプルにINSERTします
      const { error: reserveError } = await supabase
        .from('reservations')
        .insert({
          user_id: userId,
          course_id: course.id,
          reservation_date: new Date().toISOString(), // 仮の日時（現在）
          status: 'confirmed'
        });

      if (reserveError) throw reserveError;

      alert('予約が完了しました！');
      
      // 親コンポーネントへの通知またはリロード
      if (onReserveComplete) {
        onReserveComplete();
      }
      window.location.reload();
      
    } catch (error: any) {
      alert('予約エラー: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* タイトルとポイント */}
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-lg font-bold text-gray-900 leading-tight">
          {course.title}
        </h4>
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
          {course.points.toLocaleString()} pt
        </span>
      </div>

      {/* 所要時間など */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center text-gray-800 font-bold bg-gray-100 px-2 py-1 rounded">
          <span className="mr-1">⏰</span>
          所要時間: {course.duration}分
        </div>
      </div>

      {/* 説明文 */}
      <p className="text-gray-700 text-sm mb-5 leading-relaxed font-medium">
        {course.description || '極上のリラックスタイムをご提供します。'}
      </p>

      {/* 予約ボタン */}
      <button
        onClick={handleReserve}
        disabled={loading}
        className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-md active:scale-95"
      >
        {loading ? '予約処理中...' : 'このコースを予約する'}
      </button>
    </div>
  );
}