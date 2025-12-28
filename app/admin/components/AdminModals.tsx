'use client';

import { useState, useEffect } from 'react';

// --- コース編集・追加用モーダル ---
type Course = {
  id?: string;
  title: string;
  description: string;
  price_points: number;
  duration_minutes: number;
};

export function CourseModal({ 
  course, 
  onClose, 
  onSave 
}: { 
  course: Course | null, 
  onClose: () => void, 
  onSave: (c: Course) => void 
}) {
  const [data, setData] = useState<Course>({
    title: '', description: '', price_points: 0, duration_minutes: 0
  });

  useEffect(() => {
    if (course) setData(course);
    else setData({ title: '', description: '', price_points: 3000, duration_minutes: 60 });
  }, [course]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{course?.id ? 'コース編集' : '新規コース追加'}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500">コース名</label>
            <input className="w-full border p-2 rounded" value={data.title} onChange={e => setData({...data, title: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">説明文</label>
            <textarea className="w-full border p-2 rounded h-20" value={data.description || ''} onChange={e => setData({...data, description: e.target.value})} />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500">価格 (pt)</label>
              <input type="number" className="w-full border p-2 rounded" value={data.price_points} onChange={e => setData({...data, price_points: parseInt(e.target.value)})} />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500">所要時間 (分)</label>
              <input type="number" className="w-full border p-2 rounded" value={data.duration_minutes} onChange={e => setData({...data, duration_minutes: parseInt(e.target.value)})} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded text-sm">キャンセル</button>
          <button onClick={() => onSave(data)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold">保存</button>
        </div>
      </div>
    </div>
  );
}

// --- 予約時間変更用モーダル ---
type ReservationEdit = {
  id: string;
  start_time: string;
  end_time: string;
  display_name: string;
  course_title: string;
};

export function ReservationModal({ 
  reservation, 
  onClose, 
  onSave,
  onDelete
}: { 
  reservation: ReservationEdit, 
  onClose: () => void, 
  onSave: (id: string, start: string, end: string) => void,
  onDelete: (id: string) => void
}) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    if (reservation) {
      const toLocalISO = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const local = new Date(date.getTime() - offset);
        return local.toISOString().slice(0, 16);
      };
      setStart(toLocalISO(new Date(reservation.start_time)));
      setEnd(toLocalISO(new Date(reservation.end_time)));
    }
  }, [reservation]);

  return (
    // z-index を 60 に上げて、詳細モーダル(z-50)より手前に出します
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-2">予約内容の変更</h2>
        <p className="text-sm text-gray-600 mb-4">{reservation.display_name} 様<br/>{reservation.course_title}</p>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500">開始日時</label>
            <input type="datetime-local" className="w-full border p-2 rounded" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">終了日時</label>
            <input type="datetime-local" className="w-full border p-2 rounded" value={end} onChange={e => setEnd(e.target.value)} />
          </div>
          <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800">
            <strong>💡 ヒント:</strong><br/>
            時間を変更すると、実質的なコース時間の短縮・延長が可能です。<br/>
            ※ポイントの増減は自動で行われません。
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 border-t pt-4">
          <button onClick={() => onDelete(reservation.id)} className="text-red-500 text-sm underline hover:text-red-700">キャンセル(削除)</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300">閉じる</button>
            <button onClick={() => onSave(reservation.id, new Date(start).toISOString(), new Date(end).toISOString())} className="px-4 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700">変更を保存</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 会員詳細モーダル ---
type UserDetail = {
  id: string;
  display_name: string;
  current_points: number;
  created_at: string;
  admin_notes: string;
  avatar_url: string;
};

type PointLog = { id: string; created_at: string; amount: number; description: string; };

// 予約情報の型を拡張して、親へ渡せるようにする
type UserReservation = {
  id: string;
  start_time: string;
  end_time: string; // end_time追加
  status: string;
  user_id: string;  // user_id追加
  courses: { title: string; price_points: number; duration_minutes: number }; // 詳細情報追加
};

export function UserDetailModal({
  user,
  reservations,
  logs,
  onClose,
  onSaveNotes,
  onEditReservation // ★追加: 編集ボタンが押された時の関数
}: {
  user: UserDetail,
  reservations: UserReservation[],
  logs: PointLog[],
  onClose: () => void,
  onSaveNotes: (id: string, notes: string) => void,
  onEditReservation: (res: any) => void // ★追加
}) {
  const [notes, setNotes] = useState(user.admin_notes || '');
  const [tab, setTab] = useState<'history' | 'points'>('history');
  const visitCount = reservations.filter(r => r.status === 'confirmed' && new Date(r.start_time) < new Date()).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex overflow-hidden">
        
        {/* 左側: プロフィール */}
        <div className="w-1/3 bg-gray-50 p-6 border-r border-gray-200 overflow-y-auto">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">
              {user.avatar_url ? <img src={user.avatar_url} alt="icon" className="w-full h-full object-cover" /> : <span className="text-4xl text-gray-500">👤</span>}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{user.display_name || '名称未設定'}</h2>
            <p className="text-xs text-gray-500 break-all">{user.id}</p>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2"><span className="text-gray-500">登録日</span><span>{new Date(user.created_at).toLocaleDateString()}</span></div>
            <div className="flex justify-between border-b pb-2"><span className="text-gray-500">来店回数</span><span className="font-bold">{visitCount} 回</span></div>
            <div className="flex justify-between border-b pb-2"><span className="text-gray-500">保有ポイント</span><span className="font-bold text-blue-600">{user.current_points.toLocaleString()} pt</span></div>
          </div>
          <div className="mt-6">
            <label className="text-xs font-bold text-gray-700 mb-1 block">管理者用メモ (カルテ)</label>
            <textarea className="w-full border p-2 rounded h-32 text-sm focus:ring-2 focus:ring-blue-500" placeholder="施術メモ..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button onClick={() => onSaveNotes(user.id, notes)} className="mt-2 w-full bg-gray-800 text-white py-2 rounded text-sm hover:bg-black">メモを保存</button>
          </div>
        </div>

        {/* 右側: 履歴リスト */}
        <div className="w-2/3 flex flex-col">
          <div className="flex border-b">
            <button onClick={() => setTab('history')} className={`flex-1 py-3 text-sm font-bold ${tab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>施術・予約履歴</button>
            <button onClick={() => setTab('points')} className={`flex-1 py-3 text-sm font-bold ${tab === 'points' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>ポイント履歴</button>
            <button onClick={onClose} className="px-4 text-gray-400 hover:text-gray-600">×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'history' ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-100"><tr><th className="p-2 text-left">日時</th><th className="p-2 text-left">コース</th><th className="p-2 text-left">状態</th><th className="p-2"></th></tr></thead>
                <tbody>
                  {reservations.map(r => (
                    <tr key={r.id} className="border-b">
                      <td className="p-2">{new Date(r.start_time).toLocaleString()}</td>
                      <td className="p-2">{r.courses?.title}</td>
                      <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs ${r.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{r.status}</span></td>
                      <td className="p-2 text-right">
                        {r.status !== 'cancelled' && (
                          <button 
                            onClick={() => onEditReservation({
                              ...r, 
                              profiles: { display_name: user.display_name } // 親モーダル用に整形
                            })}
                            className="text-blue-600 hover:underline text-xs border border-blue-600 px-2 py-1 rounded"
                          >
                            編集・削除
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">履歴なし</td></tr>}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100"><tr><th className="p-2 text-left">日時</th><th className="p-2 text-left">内容</th><th className="p-2 text-right">増減</th></tr></thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} className="border-b">
                      <td className="p-2 text-gray-500">{new Date(l.created_at).toLocaleDateString()}</td>
                      <td className="p-2">{l.description}</td>
                      <td className={`p-2 text-right font-bold ${l.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{l.amount > 0 ? '+' : ''}{l.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-500">履歴なし</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}