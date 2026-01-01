'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';

type Props = {
  userId: string;
  currentPoints: number;      // ★追加: page.tsxから渡されるため必須
  onChargeComplete?: () => void; // ★変更: page.tsxで渡されていないため「?」をつけて省略可能にしました
};

export default function PointCharge({ userId, currentPoints, onChargeComplete }: Props) {
  const [loading, setLoading] = useState(false);

  const handleCharge = async (amount: number) => {
    if (!confirm(`${amount}pt チャージしますか？\n(本来はここでクレジットカード決済などが動きます)`)) return;

    setLoading(true);
    try {
      // 1. ポイントを加算（propsのcurrentPointsではなく、念のためDBの最新値を取得しても良いが、ここではシンプルに計算）
      // ※ 元のコードに合わせてDB取得を行うロジックを維持します
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('current_points')
        .eq('id', userId)
        .single();

      if (fetchError || !profile) throw new Error('ユーザー情報の取得に失敗しました');

      const newPoints = (profile.current_points || 0) + amount;

      // 2. 更新実行
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ current_points: newPoints })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 3. 履歴に記録
      await supabase.from('point_logs').insert({
        user_id: userId,
        amount: amount,
        description: 'ポイントチャージ'
      });

      alert(`${amount}pt チャージしました！`);
      
      // 親から関数が渡されていれば実行、なければ画面をリロード
      if (onChargeComplete) {
        onChargeComplete();
      } else {
        window.location.reload();
      }

    } catch (err: any) {
      alert('エラー: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-700">ポイントチャージ</h3>
        {/* せっかくデータを受け取っているので現在のポイントを表示します */}
        <span className="text-sm text-blue-600 font-bold">現在: {currentPoints.toLocaleString()} pt</span>
      </div>
      
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