import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FlashcardView } from './components/FlashcardView';
import { QuizView } from './components/QuizView';
import { WordListView } from './components/WordListView';
import { GuestbookView } from './components/GuestbookView';
import { GuideModal } from './components/GuideModal';
import { SettingsModal } from './components/SettingsModal';
import { INITIAL_HANJA_DATA, INITIAL_GUESTBOOK_ENTRIES } from './data/initialHanja';
import { fetchSheetData, postSheetWord, postGuestbookEntry } from './services/sheetsService';
import { HanjaItem, GuestbookEntry } from './types/hanja';

const STORAGE_KEY_WORDS = 'hanja_words_v1';
const STORAGE_KEY_GUESTBOOK = 'hanja_guestbook_v1';
const STORAGE_KEY_URL = 'hanja_sheet_web_app_url';
const STORAGE_KEY_BOOKMARKS = 'hanja_bookmarks_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz' | 'words' | 'guestbook'>('flashcards');
  const [words, setWords] = useState<HanjaItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORDS);
      const bookmarks: (string | number)[] = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKMARKS) || '[]');
      if (saved) {
        const parsed: HanjaItem[] = JSON.parse(saved);
        return parsed.map((item) => ({
          ...item,
          isBookmarked: bookmarks.includes(item.id),
        }));
      }
      return INITIAL_HANJA_DATA.map((item) => ({
        ...item,
        isBookmarked: bookmarks.includes(item.id),
      }));
    } catch {
      return INITIAL_HANJA_DATA;
    }
  });

  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GUESTBOOK);
      return saved ? JSON.parse(saved) : INITIAL_GUESTBOOK_ENTRIES;
    } catch {
      return INITIAL_GUESTBOOK_ENTRIES;
    }
  });

  const [webAppUrl, setWebAppUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_URL) || '';
  });

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(words));
      const bookmarks = words.filter((w) => w.isBookmarked).map((w) => w.id);
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [words]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GUESTBOOK, JSON.stringify(guestbook));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [guestbook]);

  // Sync with Google Sheets
  const syncWithSheet = useCallback(async (urlToUse?: string) => {
    const url = urlToUse || webAppUrl;
    if (!url) return;

    setIsSyncing(true);
    try {
      const data = await fetchSheetData(url);

      if (data.words && data.words.length > 0) {
        const bookmarks: (string | number)[] = JSON.parse(
          localStorage.getItem(STORAGE_KEY_BOOKMARKS) || '[]'
        );
        const mappedWords = data.words.map((item, idx) => ({
          ...item,
          id: item.id || idx + 1,
          isBookmarked: bookmarks.includes(item.id || idx + 1),
        }));
        setWords(mappedWords);
      }

      if (data.guestbook && data.guestbook.length > 0) {
        setGuestbook(data.guestbook);
      }
    } catch (err) {
      console.error('Sheet sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [webAppUrl]);

  // Auto-sync on load if URL is registered
  useEffect(() => {
    if (webAppUrl) {
      syncWithSheet(webAppUrl);
    }
  }, [webAppUrl, syncWithSheet]);

  // Bookmark toggle
  const handleToggleBookmark = (id: string | number) => {
    setWords((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
      )
    );
  };

  // Add new word (with POST to Google Sheets if connected)
  const handleAddWord = async (newWordData: Partial<HanjaItem>): Promise<boolean> => {
    const newId = Date.now();
    const newWord: HanjaItem = {
      id: newId,
      hanja: newWordData.hanja || '',
      meaning: newWordData.meaning || '',
      sound: newWordData.meaning ? newWordData.meaning.split(' ').pop() || '' : '',
      radical: newWordData.radical || '',
      strokes: Number(newWordData.strokes) || 0,
      example: newWordData.example || '',
      words: newWordData.words || '',
      date: newWordData.date || new Date().toISOString().slice(0, 10),
      isBookmarked: false,
    };

    setWords((prev) => [newWord, ...prev]);

    if (webAppUrl) {
      try {
        await postSheetWord(webAppUrl, newWord);
      } catch (err) {
        console.warn('Google Sheet word post error:', err);
      }
    }

    return true;
  };

  // Add guestbook entry (with POST to Google Sheets if connected)
  const handleAddGuestbookEntry = async (entryData: Partial<GuestbookEntry>): Promise<boolean> => {
    const newEntry: GuestbookEntry = {
      id: `guest-${Date.now()}`,
      author: entryData.author || '학습자',
      hanja: entryData.hanja || '',
      message: entryData.message || '',
      score: entryData.score,
      createdAt: entryData.createdAt || new Date().toLocaleDateString('ko-KR'),
    };

    setGuestbook((prev) => [newEntry, ...prev]);

    if (webAppUrl) {
      try {
        await postGuestbookEntry(webAppUrl, newEntry);
      } catch (err) {
        console.warn('Google Sheet guestbook post error:', err);
      }
    }

    return true;
  };

  // Save new URL and test connection
  const handleSaveUrl = async (url: string) => {
    try {
      const data = await fetchSheetData(url);
      localStorage.setItem(STORAGE_KEY_URL, url);
      setWebAppUrl(url);

      if (data.words && data.words.length > 0) {
        const bookmarks: (string | number)[] = JSON.parse(
          localStorage.getItem(STORAGE_KEY_BOOKMARKS) || '[]'
        );
        const mappedWords = data.words.map((item, idx) => ({
          ...item,
          id: item.id || idx + 1,
          isBookmarked: bookmarks.includes(item.id || idx + 1),
        }));
        setWords(mappedWords);
      }

      if (data.guestbook && data.guestbook.length > 0) {
        setGuestbook(data.guestbook);
      }

      return {
        success: true,
        message: `구글 스프레드시트와 성공적으로 연결되었습니다! (${data.words?.length || 0}개 한자 불러옴)`,
        count: data.words?.length || 0,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `연결 테스트 실패: ${err.message || '웹앱 URL과 권한 설정을 확인해주세요.'}`,
      };
    }
  };

  // Disconnect sheet
  const handleDisconnect = () => {
    localStorage.removeItem(STORAGE_KEY_URL);
    setWebAppUrl('');
  };

  // Reset to default Hanja data
  const handleResetDemoData = () => {
    setWords(INITIAL_HANJA_DATA);
    setGuestbook(INITIAL_GUESTBOOK_ENTRIES);
  };

  // Quiz completion trigger to guestbook
  const handleAddQuizScoreToGuestbook = (score: number, hanjaSummary: string) => {
    setActiveTab('guestbook');
    handleAddGuestbookEntry({
      author: '열공 수험생',
      hanja: hanjaSummary,
      score,
      message: `4급 한자 퀴즈에서 ${score}점을 획득했습니다! 이 기세로 4급 국가공인 한자 자격증까지 정복하겠습니다! 🔥`,
    });
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-amber-200">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSheetConnected={Boolean(webAppUrl)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onSync={() => syncWithSheet()}
        isSyncing={isSyncing}
        wordCount={words.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'flashcards' && (
          <FlashcardView words={words} onToggleBookmark={handleToggleBookmark} />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            words={words}
            onAddGuestbookScore={handleAddQuizScoreToGuestbook}
            onBookmarkHanja={handleToggleBookmark}
          />
        )}

        {activeTab === 'words' && (
          <WordListView
            words={words}
            onAddWord={handleAddWord}
            onToggleBookmark={handleToggleBookmark}
            isSheetConnected={Boolean(webAppUrl)}
          />
        )}

        {activeTab === 'guestbook' && (
          <GuestbookView
            entries={guestbook}
            onAddEntry={handleAddGuestbookEntry}
            isSheetConnected={Boolean(webAppUrl)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-hanja font-bold text-amber-800 text-sm">漢 4級</span>
            <span>&copy; 4급 한자 맞춤형 스마트 단어장 &bull; Google Sheets &amp; Gemini AI 연동</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-amber-800 hover:underline font-semibold"
            >
              구글 시트 연동 튜토리얼
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-stone-600 hover:text-stone-900"
            >
              웹앱 API 설정
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        webAppUrl={webAppUrl}
        onSaveUrl={handleSaveUrl}
        onDisconnect={handleDisconnect}
        onOpenGuide={() => setIsGuideOpen(true)}
        onResetDemoData={handleResetDemoData}
      />
    </div>
  );
}
