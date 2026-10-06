import React from 'react';
import { Sparkles, BookOpen, Layers, CheckSquare, MessageSquare, Settings, HelpCircle, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'flashcards' | 'quiz' | 'words' | 'guestbook';
  setActiveTab: (tab: 'flashcards' | 'quiz' | 'words' | 'guestbook') => void;
  isSheetConnected: boolean;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onSync: () => void;
  isSyncing: boolean;
  wordCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isSheetConnected,
  onOpenSettings,
  onOpenGuide,
  onSync,
  isSyncing,
  wordCount,
}) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between py-3.5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-700 text-amber-50 flex items-center justify-center font-hanja text-2xl font-bold shadow-xs">
              漢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-stone-900 tracking-tight">
                  4급 한자 스마트 단어장
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                  어문회 4급
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                구글 스프레드시트 실시간 연동 &bull; 플래시카드 &bull; 4지선다 퀴즈 &bull; Gemini AI 해설
              </p>
            </div>
          </div>

          {/* Sheet status & quick actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isSheetConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
              title="구글 시트 연동 설정"
            >
              <span className={`w-2 h-2 rounded-full ${isSheetConnected ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
              <span className="hidden md:inline">
                {isSheetConnected ? '구글 시트 연동됨' : '시트 연동하기'}
              </span>
              <span className="md:hidden">
                {isSheetConnected ? '연동됨' : '미연동'}
              </span>
            </button>

            {isSheetConnected && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
                title="시트 데이터 동기화"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-700' : ''}`} />
              </button>
            )}

            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
              title="초보자용 구글 시트 연동 가이드"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>연동 가이드</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
              title="설정"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center space-x-1 sm:space-x-3 overflow-x-auto py-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'flashcards'
                ? 'bg-amber-800 text-white shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>플래시카드</span>
            <span className={`text-xs px-1.5 py-0.2 rounded-full ${activeTab === 'flashcards' ? 'bg-amber-900/60 text-amber-100' : 'bg-stone-200 text-stone-700'}`}>
              {wordCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'bg-amber-800 text-white shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>4지선다 퀴즈</span>
            <span className="flex items-center gap-0.5 text-xs text-amber-300 font-bold">
              <Sparkles className="w-3 h-3" />
              AI
            </span>
          </button>

          <button
            onClick={() => setActiveTab('words')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'words'
                ? 'bg-amber-800 text-white shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>단어장 목록 & 등록</span>
          </button>

          <button
            onClick={() => setActiveTab('guestbook')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'guestbook'
                ? 'bg-amber-800 text-white shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>방명록 & 학습기록</span>
          </button>
        </div>
      </div>
    </header>
  );
};
