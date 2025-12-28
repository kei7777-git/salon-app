'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';

type Props = {
  userId: string;
  initialName: string;
  onUpdate: () => void; // 更新後に親（画面）をリロードさせるため
};

export default function ProfileEdit({ userId, initialName, onUpdate }: Props) {
  const [name, setName] = useState(initialName || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!name.trim()) return alert('名前を入力してください');
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: name })
        .eq('id', userId);

      if (error) throw error;

      alert('名前を更新しました！');
      onUpdate(); // 画面の情報を最新にする
      
    } catch (err: any) {
      alert('エラー: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold mb-4 text-gray-800">プロフィール設定</h3>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">お名前（表示名）</label>
          <input
            type="text"
            className="w-full border p-2 rounded text-sm"
            placeholder="例: 山田 太郎"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-black mb-[1px]"
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}