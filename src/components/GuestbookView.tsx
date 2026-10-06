import React, { useState } from 'react';
import { MessageSquare, Send, Trophy, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { GuestbookEntry } from '../types/hanja';

interface GuestbookViewProps {
  entries: GuestbookEntry[];
  onAddEntry: (entry: Partial<GuestbookEntry>) => Promise<boolean>;
  isSheetConnected: boolean;
  onOpenSettings: () => void;
}

export const GuestbookView: React.FC<GuestbookViewProps> = ({
  entries,
  onAddEntry,
  isSheetConnected,
  onOpenSettings,
}) => {
  const [author, setAuthor] = useState('');
  const [hanja, setHanja] = useState('');
  const [message, setMessage] = useState('');
  const [score, setScore] = useState<string>('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !message.trim()) {
      setStatus({ type: 'error', text: '작성자와 소감/다짐을 입력해주세요.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const ok = await onAddEntry({
        author: author.trim(),
        hanja: hanja.trim() || '4급 한자 정복',
        message: message.trim(),
        score: Number(score) || 100,
        createdAt: new Date().toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });

      if (ok) {
        setStatus({
          type: 'success',
          text: isSheetConnected
            ? '구글 스프레드시트(Guestbook 시트)에 성공적으로 기록되었습니다! 🎉'
            : '방명록이 등록되었습니다. (시트 연동 시 스프레드시트에 영구 저장됩니다)',
        });
        setAuthor('');
        setHanja('');
        setMessage('');
      } else {
        setStatus({ type: 'error', text: '등록에 실패했습니다.' });
      }
    } catch {
      setStatus({ type: 'error', text: '전송 중 문제가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Banner */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-stone-900">4급 한자 학습 방명록 & 게시판</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
              구글 시트 DB
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            오늘 공부한 한자, 퀴즈 점수, 학습 다짐을 남겨보세요. 구글 시트의 <code className="bg-stone-100 px-1 py-0.5 rounded text-amber-900">Guestbook</code> 시트에 실시간 행으로 저장됩니다.
          </p>
        </div>

        {!isSheetConnected && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>내 구글 시트 연결하기</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Write Form */}
        <div className="md:col-span-1 bg-white rounded-xl border border-stone-200 p-5 shadow-xs h-fit space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <MessageSquare className="w-4 h-4 text-amber-700" />
            <h3 className="font-bold text-sm text-stone-800">방명록 / 학습 다짐 남기기</h3>
          </div>

          {status && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                status.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{status.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                작성자(닉네임) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="예: 4급합격기원"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">오늘의 한자 / 목표</label>
              <input
                type="text"
                value={hanja}
                onChange={(e) => setHanja(e.target.value)}
                placeholder="예: 決 (결단할 결)"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">퀴즈 점수 / 달성률</label>
              <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="100"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                학습 소감 & 다짐 <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="오늘 공부한 내용이나 응원의 한마디를 남겨보세요!"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? '시트에 등록 중...' : '구글 시트에 등록 (POST)'}</span>
            </button>
          </form>
        </div>

        {/* Guestbook Entries Feed */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span className="font-semibold text-stone-700">
              학습 기록 피드 ({entries.length}개)
            </span>
            <span>최신순 정렬</span>
          </div>

          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs hover:border-stone-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-sm">
                      {entry.author.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                        <span>{entry.author}</span>
                        {entry.hanja && (
                          <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-hanja">
                            {entry.hanja}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-600">{entry.createdAt}</span>
                    </div>
                  </div>

                  {entry.score !== undefined && (
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/50">
                      <Trophy className="w-3 h-3 text-amber-600" />
                      <span>{entry.score}점</span>
                    </div>
                  )}
                </div>

                <p className="mt-3 text-stone-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap pl-11">
                  {entry.message}
                </p>
              </div>
            ))}

            {entries.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-stone-200 text-stone-400">
                아직 등록된 방명록이 없습니다. 첫 학습 다짐을 남겨보세요!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
