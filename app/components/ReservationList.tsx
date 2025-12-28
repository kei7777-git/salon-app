'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

type Reservation = {
  id: string;
  start_time: string;
  status: string;
  courses: {
    title: string;
    duration_minutes: number;
    price_points: number; // 返金のために価格が必要
  };
};

export default function ReservationList({ userId }: { userId: string }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // データ取得
  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        start_time,
        status,
        courses (
          title,
          duration_minutes,
          price_points
        )
      `)
      .eq('user_id', userId)
      .neq('status', 'cancelled') // キャンセル済みは表示しない（あるいは履歴として残すなら外す）
      .order('start_time', { ascending: true });

    if (error) console.error(error);
    else setReservations(data as any);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchReservations();
  }, [userId]);

  // キャンセル処理
  const handleCancel = async (res: Reservation) => {
    if (!confirm('予約をキャンセルしますか？\n消費したポイントは返還されます。')) return;

    try {
      // 1. ユーザーの現在のポイントを取得（返還のため）
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_points, display_name')
        .eq('id', userId)
        .single();

      if (!profile) throw new Error('ユーザー情報が取得できません');

      // 2. ポイント返還
      const refundAmount = res.courses.price_points;
      const newPoints = (profile.current_points || 0) + refundAmount;

      await supabase.from('profiles').update({ current_points: newPoints }).eq('id', userId);

      // 3. ログ記録
      await supabase.from('point_logs').insert({
        user_id: userId,
        amount: refundAmount,
        description: `キャンセル返還: ${res.courses.title}`
      });

      // 4. 予約ステータスを 'cancelled' に変更
      // (deleteしてしまうと履歴が消えるので、status変更が一般的ですが、
      //  今回は「削除」という要望に合わせて一覧から消えるように見せます)
      await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', res.id);

      // 5. 管理者に通知を送る
      const dateStr = new Date(res.start_time).toLocaleString();
      await supabase.from('admin_notifications').insert({
        message: `【キャンセル】${profile.display_name || '未設定'}様が ${dateStr} の予約をキャンセルしました。`
      });

      alert('予約をキャンセルしました。ポイントが返還されました。');
      fetchReservations(); // リスト更新
      window.location.reload(); // ポイント表示更新のため画面リロード

    } catch (err: any) {
      alert('エラー: ' + err.message);
    }
  };

  if (loading) return <div>読み込み中...</div>;
  if (reservations.length === 0) return <div className="text-gray-500 text-sm">現在の予約はありません</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
      <h3 className="text-lg font-bold mb-4 text-gray-800">あなたの予約一覧</h3>
      <div className="space-y-4">
        {reservations.map((res) => {
          const date = new Date(res.start_time);
          // 過去の予約はキャンセルできないようにする制御
          const isPast = new Date() > date;

          return (
            <div key={res.id} className="flex justify-between items-center border-b pb-4 last:border-0">
              <div>
                <div className="font-semibold text-gray-900">
                  {res.courses.title}
                </div>
                <div className="text-sm text-gray-600">
                  {date.toLocaleDateString()} <span className="font-bold">{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  （{res.courses.duration_minutes}分）
                </div>
              </div>
              <div>
                {!isPast && (
                  <button
                    onClick={() => handleCancel(res)}
                    className="text-xs border border-red-500 text-red-600 px-3 py-1.5 rounded hover:bg-red-50"
                  >
                    キャンセル
                  </button>
                )}
                {isPast && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">来店済み</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}