'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { CourseModal, ReservationModal, UserDetailModal } from './components/AdminModals';

type Reservation = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  user_id: string;
  courses: { title: string; duration_minutes: number; price_points: number };
  profiles: { display_name: string; id: string; current_points: number };
};

type Schedule = { date: string; open_time: string; close_time: string; is_closed: boolean };
type Notification = { id: string; message: string; created_at: string };
type Course = { id: string; title: string; description: string; price_points: number; duration_minutes: number };

function getSunday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff));
}

export default function AdminPage() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<'calendar' | 'users' | 'courses'>('calendar');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getSunday(today));
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [chargeAmounts, setChargeAmounts] = useState<{[key: string]: string}>({});
  
  // モーダル制御
  const [editingCourse, setEditingCourse] = useState<Course | null | 'new'>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [viewingUserRes, setViewingUserRes] = useState<any[]>([]);
  const [viewingUserLogs, setViewingUserLogs] = useState<any[]>([]);

  const fetchData = async () => {
    const { data: notif } = await supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(5);
    if (notif) setNotifications(notif);

    const startOfWeek = new Date(currentWeekStart); startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(currentWeekStart); endOfWeek.setDate(endOfWeek.getDate()+6); endOfWeek.setHours(23,59,59,999);

    const { data: scheds } = await supabase.from('schedules').select('*').gte('date', startOfWeek.toISOString().split('T')[0]).lte('date', endOfWeek.toISOString().split('T')[0]);
    if (scheds) setSchedules(scheds);

    const { data: resWeek } = await supabase.from('reservations').select(`
        id, start_time, end_time, status, user_id,
        courses (title, duration_minutes, price_points),
        profiles (display_name, id, current_points)
      `).gte('start_time', startOfWeek.toISOString()).lte('start_time', endOfWeek.toISOString()).neq('status', 'cancelled').order('start_time');
    if (resWeek) setReservations(resWeek as any);

    if (activeTab === 'users' || activeTab === 'calendar') {
      const { data: allRes } = await supabase.from('reservations').select(`
          id, start_time, end_time, status, user_id,
          courses (title, duration_minutes, price_points),
          profiles (display_name, id, current_points)
        `).order('start_time', { ascending: false }).limit(50);
      if (allRes) setAllReservations(allRes as any);

      const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profs) setProfiles(profs);
    }

    if (activeTab === 'courses') {
       const { data: cs } = await supabase.from('courses').select('*').order('created_at');
       if (cs) setCourses(cs);
    }
  };

  useEffect(() => { fetchData(); }, [currentWeekStart, activeTab]);

  // --- アクション: 会員詳細を開く (データ取得を強化) ---
  const handleOpenUserDetail = async (user: any) => {
    setViewingUser(user);
    // ★修正: 編集に必要なデータを全て取得するように変更
    const { data: res } = await supabase.from('reservations')
      .select(`
        id, start_time, end_time, status, user_id,
        courses (title, duration_minutes, price_points)
      `)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });
    if(res) setViewingUserRes(res);
    
    const { data: logs } = await supabase.from('point_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if(logs) setViewingUserLogs(logs);
  };

  // --- アクション: 予約編集/キャンセル ---
  const handleAdminCancel = async (id: string, userId: string, points: number) => {
    if (!confirm('キャンセルして削除しますか？\nポイントは返還されます。')) return;
    try {
      const { data: profile } = await supabase.from('profiles').select('current_points').eq('id', userId).single();
      const current = profile?.current_points || 0;
      await supabase.from('profiles').update({ current_points: current + points }).eq('id', userId);
      await supabase.from('point_logs').insert({ user_id: userId, amount: points, description: '管理者キャンセル' });
      await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id);
      
      alert('キャンセルしました');
      setEditingReservation(null);
      // 詳細モーダルが開いていればそちらのデータも更新
      if (viewingUser) handleOpenUserDetail(viewingUser);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateReservationTime = async (id: string, start: string, end: string) => {
    if (!confirm('時間を変更しますか？')) return;
    const { error } = await supabase.from('reservations').update({ start_time: start, end_time: end }).eq('id', id);
    if (error) alert('エラー: ' + error.message);
    else {
      alert('変更しました');
      setEditingReservation(null);
      if (viewingUser) handleOpenUserDetail(viewingUser);
      fetchData();
    }
  };

  const handleSaveUserNotes = async (id: string, notes: string) => {
    const { error } = await supabase.from('profiles').update({ admin_notes: notes }).eq('id', id);
    if(error) alert(error.message); else { alert('メモを保存しました'); fetchData(); }
  };

  const handleSaveCourse = async (c: any) => {
    if (!c.title) return alert('コース名は必須です');
    const payload = { title: c.title, description: c.description, price_points: c.price_points, duration_minutes: c.duration_minutes };
    if (c.id) await supabase.from('courses').update(payload).eq('id', c.id);
    else await supabase.from('courses').insert(payload);
    setEditingCourse(null); fetchData();
  };
  const handleDeleteCourse = async (id: string) => {
    if(!confirm('本当に削除しますか？')) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if(error) alert('削除できませんでした'); else fetchData();
  };
  const handleClearNotification = async (id: string) => { await supabase.from('admin_notifications').delete().eq('id', id); fetchData(); };
  const handleAddPoints = async (userId: string, currentPoints: number) => {
    const amount = parseInt(chargeAmounts[userId] || '0');
    if (!amount || !confirm(`${amount}pt 追加しますか？`)) return;
    await supabase.from('profiles').update({ current_points: (currentPoints || 0) + amount }).eq('id', userId);
    await supabase.from('point_logs').insert({ user_id: userId, amount, description: '管理付与' });
    alert('追加しました'); setChargeAmounts({...chargeAmounts, [userId]: ''}); fetchData();
  };
  const moveWeek = (d: 'prev'|'next') => { const n = new Date(currentWeekStart); n.setDate(n.getDate() + (d==='next'?7:-7)); setCurrentWeekStart(n); };
  const timeToTop = (t: string) => ((new Date(t).getHours()-9)*60 + new Date(t).getMinutes())/(12*60)*100;
  const durationToHeight = (res: Reservation) => {
    const start = new Date(res.start_time).getTime();
    const end = new Date(res.end_time).getTime();
    return ((end - start) / 60000 / (12 * 60)) * 100;
  };
  const weekDays = Array.from({length:7}, (_, i) => { const d=new Date(currentWeekStart); d.setDate(d.getDate()+i); return d; });

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* --- モーダル --- */}
        {editingCourse && <CourseModal course={editingCourse === 'new' ? null : editingCourse} onClose={() => setEditingCourse(null)} onSave={handleSaveCourse} />}
        
        {/* 予約編集モーダル */}
        {editingReservation && (
          <ReservationModal 
            reservation={{
              id: editingReservation.id,
              start_time: editingReservation.start_time,
              end_time: editingReservation.end_time,
              display_name: editingReservation.profiles.display_name,
              course_title: editingReservation.courses.title
            }}
            onClose={() => setEditingReservation(null)}
            onSave={handleUpdateReservationTime}
            onDelete={(id) => handleAdminCancel(id, editingReservation?.user_id || '', editingReservation?.courses.price_points || 0)}
          />
        )}

        {/* 会員詳細モーダル */}
        {viewingUser && (
          <UserDetailModal 
            user={viewingUser}
            reservations={viewingUserRes}
            logs={viewingUserLogs}
            onClose={() => setViewingUser(null)}
            onSaveNotes={handleSaveUserNotes}
            // ★編集ボタンが押されたら、ReservationModalを開く
            onEditReservation={(res) => setEditingReservation(res)}
          />
        )}

        {/* --- メイン画面 (省略なし) --- */}
        {notifications.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg shadow-sm">
            <h2 className="text-sm font-bold text-yellow-800 mb-2">🔔 新着通知</h2>
            <div className="space-y-1">{notifications.map(n => (<div key={n.id} className="flex justify-between bg-white p-2 rounded text-sm border border-yellow-100"><span>{n.message}</span><button onClick={() => handleClearNotification(n.id)} className="text-gray-400 hover:text-red-500">×</button></div>))}</div>
          </div>
        )}

        <div className="flex items-end justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">サロン管理画面</h1>
        </div>

        <div className="flex border-b border-gray-300 gap-4 overflow-x-auto">
          <button onClick={() => setActiveTab('calendar')} className={`pb-2 px-4 font-bold whitespace-nowrap ${activeTab === 'calendar' ? 'border-b-4 border-black text-black' : 'text-gray-400'}`}>📅 週間カレンダー</button>
          <button onClick={() => setActiveTab('users')} className={`pb-2 px-4 font-bold whitespace-nowrap ${activeTab === 'users' ? 'border-b-4 border-black text-black' : 'text-gray-400'}`}>👥 会員管理</button>
          <button onClick={() => setActiveTab('courses')} className={`pb-2 px-4 font-bold whitespace-nowrap ${activeTab === 'courses' ? 'border-b-4 border-black text-black' : 'text-gray-400'}`}>⚙️ コース設定</button>
        </div>

        {activeTab === 'calendar' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
              <button onClick={() => moveWeek('prev')} className="bg-gray-100 px-4 py-2 rounded font-bold">← 前の週</button>
              <h2 className="text-lg font-bold text-gray-800">{weekDays[0].toLocaleDateString()} 〜 {weekDays[6].toLocaleDateString()}</h2>
              <button onClick={() => moveWeek('next')} className="bg-gray-100 px-4 py-2 rounded font-bold">次の週 →</button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-7 border-b pb-2 mb-2">
                  {weekDays.map((date, i) => (<div key={i} className={`text-center ${date.toISOString().split('T')[0] === todayStr ? 'bg-blue-50 text-blue-600 rounded-t' : ''}`}><div className="text-sm font-bold">{date.toLocaleDateString('ja-JP', { weekday: 'short' })}</div><div className="text-lg font-bold">{date.getDate()}</div></div>))}
                </div>
                <div className="relative h-[600px] border border-gray-200 bg-gray-50 flex">
                  <div className="absolute inset-0 pointer-events-none z-0">{[9,10,11,12,13,14,15,16,17,18,19,20].map((h, i) => (<div key={h} className="absolute w-full border-t border-gray-300" style={{top: `${(i/12)*100}%`}}><span className="absolute -top-3 left-1 text-xs text-gray-400 bg-gray-50 px-1">{h}:00</span></div>))}</div>
                  {weekDays.map((date, i) => {
                    const targetStr = date.toISOString().split('T')[0];
                    const dailyRes = reservations.filter(r => r.start_time.startsWith(targetStr));
                    const sched = schedules.find(s => s.date === targetStr);
                    return (
                      <div key={i} className="flex-1 relative border-r border-gray-200 last:border-r-0 h-full">
                        {sched?.is_closed && <div className="absolute inset-0 bg-gray-100 bg-opacity-80 flex items-center justify-center z-20"><span className="text-gray-400 font-bold transform -rotate-45 text-sm">休業日</span></div>}
                        {dailyRes.map(res => (
                          <div key={res.id} onClick={() => setEditingReservation(res)} className="absolute left-1 right-1 bg-blue-100 border-l-4 border-blue-600 rounded p-1 z-10 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer overflow-hidden" style={{ top: `${timeToTop(res.start_time)}%`, height: `${durationToHeight(res)}%` }}>
                            <div className="text-[10px] font-bold text-blue-800 leading-tight">{new Date(res.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                            <div className="text-[10px] font-bold text-gray-900 truncate leading-tight">{res.profiles.display_name}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden p-6 mt-8">
              <h2 className="text-xl font-bold mb-4 text-gray-700 border-b pb-2">直近の予約リスト</h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs text-gray-500">日時</th><th className="px-4 py-2 text-left text-xs text-gray-500">コース</th><th className="px-4 py-2 text-left text-xs text-gray-500">名前</th><th className="px-4 py-2"></th></tr></thead>
                <tbody className="divide-y divide-gray-200">{allReservations.slice(0, 10).map(r => (<tr key={r.id}><td className="px-4 py-3 text-sm">{new Date(r.start_time).toLocaleString()}</td><td className="px-4 py-3 text-sm">{r.courses?.title}</td><td className="px-4 py-3 text-sm font-bold">{r.profiles?.display_name}</td><td className="px-4 py-3 text-right">{r.status !== 'cancelled' && <button onClick={()=>setEditingReservation(r)} className="text-blue-500 text-xs hover:underline">編集</button>}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8 animate-fade-in">
            <section className="bg-white rounded-lg shadow overflow-hidden p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-700 border-b pb-2">会員管理</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr><th className="px-4 py-2 text-left text-xs text-gray-500">詳細</th><th className="px-4 py-2 text-left text-xs text-gray-500">名前</th><th className="px-4 py-2 text-left text-xs text-gray-500">Pt</th><th className="px-4 py-2 text-left text-xs text-gray-500">ポイント操作</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {profiles.map(p => (
                      <tr key={p.id}>
                        <td className="px-4 py-3"><button onClick={() => handleOpenUserDetail(p)} className="bg-gray-800 text-white text-xs px-3 py-1 rounded hover:bg-black">詳細・カルテ</button></td>
                        <td className="px-4 py-3"><div className="font-bold">{p.display_name}</div><div className="text-xs text-gray-400">{p.id.slice(0,8)}...</div></td>
                        <td className="px-4 py-3 font-bold text-blue-600">{p.current_points?.toLocaleString()}</td>
                        <td className="px-4 py-3 flex gap-2"><input type="number" className="border w-24 px-2 py-1 rounded" value={chargeAmounts[p.id]||''} onChange={e=>setChargeAmounts({...chargeAmounts, [p.id]:e.target.value})} /><button onClick={()=>handleAddPoints(p.id, p.current_points)} className="bg-green-600 text-white text-xs px-3 py-1 rounded">追加</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
        
        {activeTab === 'courses' && (
          <div className="animate-fade-in bg-white p-6 rounded-lg shadow">
             <div className="flex justify-between mb-4"><h2 className="font-bold">コース一覧</h2><button onClick={() => setEditingCourse('new')} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">+ 新規コース作成</button></div>
             <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs text-gray-500">コース名</th><th className="px-4 py-2 text-left text-xs text-gray-500">Pt</th><th className="px-4 py-2 text-left text-xs text-gray-500">分</th><th className="px-4 py-2"></th></tr></thead>
               <tbody className="divide-y divide-gray-200">
                 {courses.map(c => (
                   <tr key={c.id}>
                     <td className="p-4 font-bold text-gray-800">{c.title}</td><td className="p-4">{c.price_points} pt</td><td className="p-4">{c.duration_minutes} 分</td>
                     <td className="p-4 text-right"><button onClick={()=>setEditingCourse(c)} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded mr-2 hover:bg-gray-200">編集</button><button onClick={()=>handleDeleteCourse(c.id)} className="bg-red-50 text-red-600 text-xs px-3 py-1 rounded hover:bg-red-100">削除</button></td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}