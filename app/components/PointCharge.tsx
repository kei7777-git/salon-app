'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';

type Props = {
  userId: string;
  onChargeComplete: () => void; // チャージ完了後に画面を更新するため
};

export default function PointCharge({ userId, onChargeComplete }: Props) {
  const [loading, setLoading] = useState(false);

  const handleCharge = async (amount: number) => {
    if (!confirm(`${amount}pt チャージしますか？\n(本来はここでクレジットカード決済などが動きます)`)) return;

    setLoading(true);
    try {
      // 1. 現在のポイントを取得
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_points')
        .eq('id', userId)
        .single();

      if (!profile) throw new Error('ユーザーが見つかりません');

      // 2. ポイントを加算
      const newPoints = (profile.current_points || 0) + amount;

      const { error } = await supabase
        .from('profiles')
        .update({ current_points: newPoints })
        .eq('id', userId);

      if (error) throw error;

      // 3. 履歴に記録
      await supabase.from('point_logs').insert({
        user_id: userId,
        amount: amount,
        description: 'ポイントチャージ'
      });

      alert(`${amount}pt チャージしました！`);
      onChargeComplete(); // 親コンポーネントに通知

    } catch (err: any) {
      alert('エラー: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
      <h3 className="font-bold text-gray-700 mb-3">ポイントチャージ</h3>
      <div className="flex gap-2">
        <button
          onClick={() => handleCharge(1000)}
          disabled={loading}
          className="bg-white border border-blue-300 text-blue-600 px-4 py-2 rounded hover:bg-blue-50 font-medium"
        >
          +1,000 pt
        </button>
        <button
          onClick={() => handleCharge(5000)}
          disabled={loading}
          className="bg-white border border-blue-300 text-blue-600 px-4 py-2 rounded hover:bg-blue-50 font-medium"
        >
          +5,000 pt
        </button>
        <button
          onClick={() => handleCharge(10000)}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium shadow-sm"
        >
          +10,000 pt
        </button>
      </div>
    </div>
  );
}