'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

type Course = {
  id: string;
  title: string;
  description: string;
  price_points: number;
  duration_minutes: number;
};

type Props = {
  course: Course;
  userId?: string;
  userPoints: number;
  onReserveComplete: () => void;
};

export default function CourseCard({ course, userId, userPoints, onReserveComplete }: Props) {
  const [isBooking, setIsBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(''); 
  const [availableSlots, setAvailableSlots] = useState<string[]>([]); 
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [scheduleInfo, setScheduleInfo] = useState<{open: string, close: string, isClosed: boolean} | null>(null);

  useEffect(() => {
    if (!selectedDate) return;
    checkAvailability(selectedDate);
  }, [selectedDate]);

  const checkAvailability = async (dateStr: string) => {
    setLoadingSlots(true);
    setAvailableSlots([]);
    setScheduleInfo(null);

    // 1. その日のスケジュール設定(営業時間)を取得する
    const { data: schedData } = await supabase
      .from('schedules')
      .select('*')
      .eq('date', dateStr)
      .single();

    // デフォルト設定 (設定がなければ 10:00 - 18:00)
    let openHour = 10;
    let openMin = 0;
    let closeHour = 18;
    let closeMin = 0;
    let isClosed = false;

    if (schedData) {
      if (schedData.is_closed) {
        isClosed = true;
      } else {
        const [oh, om] = schedData.open_time.split(':').map(Number);
        const [ch, cm] = schedData.close_time.split(':').map(Number);
        openHour = oh; openMin = om;
        closeHour = ch; closeMin = cm;
      }
    }

    // 情報を画面表示用に保存
    setScheduleInfo({
      open: schedData ? schedData.open_time : '10:00',
      close: schedData ? schedData.close_time : '18:00',
      isClosed: isClosed
    });

    if (isClosed) {
      setLoadingSlots(false);
      return; // 休業日ならここで終了
    }

    // 2. その日の既存予約を取得
    const startOfDay = new Date(`${dateStr}T00:00:00`).toISOString();
    const endOfDay = new Date(`${dateStr}T23:59:59`).toISOString();

    const { data: existingReservations } = await supabase
      .from('reservations')
      .select('start_time, end_time')
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .neq('status', 'cancelled');

    // 3. 時間枠を作る (30分刻み)
    const slots: string[] = [];
    const now = new Date();

    // ループ開始時間と終了時間を分単位に変換して計算
    const startTotalMins = openHour * 60 + openMin;
    const endTotalMins = closeHour * 60 + closeMin;

    for (let currentMins = startTotalMins; currentMins < endTotalMins; currentMins += 30) {
      // 分を HH:MM に戻す
      const h = Math.floor(currentMins / 60);
      const m = currentMins % 60;
      
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      
      // スロットの開始時刻 Dateオブジェクト
      const currentSlotStart = new Date(`${dateStr}T${timeStr}:00`);

      // 過去は除外
      if (currentSlotStart < now) continue;

      // スロットの終了時刻
      const currentSlotEnd = new Date(currentSlotStart.getTime() + course.duration_minutes * 60000);

      // --- ルール1: 閉店時間を超えるか？ ---
      // 閉店時間のDateオブジェクト作成
      const closeDate = new Date(`${dateStr}T${schedData ? schedData.close_time : '18:00'}:00`);
      if (currentSlotEnd > closeDate) continue;

      // --- ルール2: 他の予約と重なるか？ ---
      let isConflict = false;
      if (existingReservations) {
        for (const res of existingReservations) {
          const resStart = new Date(res.start_time);
          const resEnd = new Date(res.end_time);
          if (currentSlotStart < resEnd && currentSlotEnd > resStart) {
            isConflict = true;
            break;
          }
        }
      }

      if (!isConflict) {
        slots.push(timeStr);
      }
    }

    setAvailableSlots(slots);
    setLoadingSlots(false);
  };

  const handleReserve = async (timeStr: string) => {
    if (!confirm(`${selectedDate} ${timeStr} から予約しますか？\n消費ポイント: ${course.price_points}pt`)) return;
    if (userPoints < course.price_points) return alert('ポイント不足です');

    try {
      const startTime = new Date(`${selectedDate}T${timeStr}:00`);
      const endTime = new Date(startTime.getTime() + course.duration_minutes * 60000);

      await supabase.from('profiles').update({ current_points: userPoints - course.price_points }).eq('id', userId);
      await supabase.from('point_logs').insert({ user_id: userId, amount: -course.price_points, description: `予約: ${course.title}` });
      const { error } = await supabase.from('reservations').insert({
        user_id: userId,
        course_id: course.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'confirmed',
      });

      if (error) throw error;
      alert('予約完了しました！');
      setIsBooking(false);
      onReserveComplete(); 

    } catch (err: any) {
      alert('エラー: ' + err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-2 text-gray-900">{course.title}</h2>
      <p className="text-gray-600 text-sm mb-4 flex-grow">{course.description}</p>
      
      <div className="flex justify-between items-end border-t pt-4 mb-4">
        <div>
          <span className="text-xs text-gray-500 block">所要時間</span>
          <span className="font-medium">{course.duration_minutes}分</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 block">価格</span>
          <span className={`text-lg font-bold ${userPoints >= course.price_points ? 'text-blue-600' : 'text-red-500'}`}>
            {course.price_points} pt
          </span>
        </div>
      </div>

      {isBooking ? (
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-gray-700">日付を選択</label>
            <button onClick={() => setIsBooking(false)} className="text-xs text-gray-500 underline">閉じる</button>
          </div>
          
          <input
            type="date"
            className="w-full border p-2 rounded mb-4 text-sm"
            min={new Date().toISOString().split('T')[0]} 
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          {selectedDate && (
            <div>
              <div className="flex justify-between items-center mb-2">
                 <p className="text-xs font-bold text-gray-700">空き時間</p>
                 {scheduleInfo && (
                   <span className="text-[10px] bg-gray-200 px-2 py-1 rounded">
                     {scheduleInfo.isClosed ? '休業日' : `${scheduleInfo.open} - ${scheduleInfo.close}`}
                   </span>
                 )}
              </div>
              
              {loadingSlots ? (
                <p className="text-xs text-gray-400">確認中...</p>
              ) : scheduleInfo?.isClosed ? (
                <p className="text-sm text-red-500 font-bold bg-red-50 p-2 rounded text-center">この日はお休みです</p>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleReserve(time)}
                      className="bg-white border border-blue-500 text-blue-600 py-1 text-sm rounded hover:bg-blue-50 transition-colors"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-red-500">空きがありません</p>
              )}
            </div>
          )}
        </div>
      ) : (
        userId ? (
          <button
            onClick={() => setIsBooking(true)}
            disabled={userPoints < course.price_points}
            className={`w-full py-2 rounded-md transition-colors text-white ${
              userPoints >= course.price_points 
                ? 'bg-black hover:bg-gray-800' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {userPoints >= course.price_points ? '日時を選択して予約' : 'ポイント不足'}
          </button>
        ) : (
          <button disabled className="w-full bg-gray-300 text-white py-2 rounded-md cursor-not-allowed">
            予約するにはログイン
          </button>
        )
      )}
    </div>
  );
}