import React, { useState, useEffect, useCallback } from 'react';
import { 
  Volume2, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Star, 
  Sparkles, 
  Play, 
  Pause, 
  LayoutGrid, 
  CreditCard,
  BookOpen,
  Info
} from 'lucide-react';
import { HanjaItem, AiFeedback } from '../types/hanja';
import { requestAiFeedback } from '../services/aiService';

interface FlashcardViewProps {
  words: HanjaItem[];
  onToggleBookmark: (id: string | number) => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ words, onToggleBookmark }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayMode, setDisplayMode] = useState<'single' | 'grid'>('single');
  const [aiInsight, setAiInsight] = useState<AiFeedback | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Filtered list based on bookmark filter
  const activeWords = onlyBookmarks
    ? words.filter((w) => w.isBookmarked)
    : words;

  const currentWord: HanjaItem | undefined = activeWords[currentIndex] || activeWords[0];

  // Reset index when list changes
  useEffect(() => {
    if (currentIndex >= activeWords.length) {
      setCurrentIndex(0);
    }
  }, [activeWords.length, currentIndex]);

  // Reset flip and AI insight on card navigation
  useEffect(() => {
    setIsFlipped(false);
    setAiInsight(null);
  }, [currentIndex, onlyBookmarks]);

  // Auto-play slideshow timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && activeWords.length > 0) {
      timer = setInterval(() => {
        setIsFlipped((prev) => {
          if (!prev) {
            return true; // Flip to back first
          } else {
            // Next card
            setCurrentIndex((idx) => (idx + 1) % activeWords.length);
            return false;
          }
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeWords.length]);

  // TTS Speech
  const speakHanja = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentWord) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`${currentWord.meaning}. ${currentWord.words}`);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('Speech error:', err);
    }
  }, [currentWord]);

  // Next / Prev handlers
  const handlePrev = useCallback(() => {
    if (activeWords.length === 0) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activeWords.length - 1));
  }, [activeWords.length]);

  const handleNext = useCallback(() => {
    if (activeWords.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activeWords.length);
  }, [activeWords.length]);

  const handleShuffle = () => {
    if (activeWords.length <= 1) return;
    const randomIdx = Math.floor(Math.random() * activeWords.length);
    setCurrentIndex(randomIdx !== currentIndex ? randomIdx : (randomIdx + 1) % activeWords.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (displayMode !== 'single') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayMode, handleNext, handlePrev]);

  // AI Deep Dive explanation for current card
  const handleFetchAiInsight = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWord || isLoadingAi) return;

    setIsLoadingAi(true);
    try {
      const feedback = await requestAiFeedback({
        hanja: currentWord.hanja,
        meaning: currentWord.meaning,
        isCorrect: true,
        correctAnswer: currentWord.meaning,
        radical: currentWord.radical,
        strokes: currentWord.strokes,
        example: currentWord.example,
        words: currentWord.words,
      });
      setAiInsight(feedback);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingAi(false);
    }
  };

  if (words.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-2xl border border-stone-200">
        <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-stone-700">단어가 비어 있습니다</h3>
        <p className="text-sm text-stone-500 mt-1">
          상단 '단어장 목록 & 등록' 탭에서 새 한자를 등록하거나 구글 시트를 연동해보세요.
        </p>
      </div>
    );
  }

  if (activeWords.length === 0 && onlyBookmarks) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-2xl border border-stone-200">
        <Star className="w-12 h-12 text-amber-300 mx-auto mb-3 fill-amber-100" />
        <h3 className="text-lg font-bold text-stone-700">즐겨찾기한 한자가 없습니다</h3>
        <p className="text-sm text-stone-500 mt-1 mb-4">
          카드 우측 상단의 별표(★)를 눌러 복습하고 싶은 중요 한자를 저장해보세요.
        </p>
        <button
          onClick={() => setOnlyBookmarks(false)}
          className="px-4 py-2 bg-amber-700 text-white rounded-lg text-sm font-medium hover:bg-amber-800"
        >
          전체 단어 보기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnlyBookmarks(!onlyBookmarks)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              onlyBookmarks
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyBookmarks ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>중요 단어만 보기</span>
            {onlyBookmarks && <span className="ml-1 text-xs text-amber-700">({activeWords.length})</span>}
          </button>

          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-50 text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors"
            title="단어 무작위 섞기"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>셔플</span>
          </button>

          {displayMode === 'single' && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isPlaying
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
              title="자동 슬라이드쇼"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? '재생 중' : '자동 넘김'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-stone-500 hidden sm:block">
            {currentIndex + 1} / {activeWords.length} (
            {Math.round(((currentIndex + 1) / activeWords.length) * 100)}%)
          </div>

          <div className="flex border border-stone-200 rounded-lg p-0.5 bg-stone-50">
            <button
              onClick={() => setDisplayMode('single')}
              className={`p-1.5 rounded-md ${displayMode === 'single' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}
              title="카드 한 장씩 보기"
            >
              <CreditCard className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDisplayMode('grid')}
              className={`p-1.5 rounded-md ${displayMode === 'grid' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}
              title="그리드 모아보기"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {displayMode === 'single' && (
        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-700 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / activeWords.length) * 100}%` }}
          />
        </div>
      )}

      {/* Single Card Mode */}
      {displayMode === 'single' && currentWord && (
        <div className="flex flex-col items-center">
          {/* 3D Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full max-w-xl h-[400px] sm:h-[430px] perspective-1000 cursor-pointer select-none group"
          >
            <div
              className={`relative w-full h-full duration-500 transform-style-3d transition-transform shadow-lg hover:shadow-xl rounded-2xl ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* CARD FRONT (한자 중심) */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-white border-2 border-stone-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
                {/* Header of front */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-semibold border border-stone-200">
                      부수: {currentWord.radical}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-semibold border border-stone-200">
                      {currentWord.strokes}획
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={speakHanja}
                      className="p-2 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
                      title="음성 읽기"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(currentWord.id);
                      }}
                      className="p-2 rounded-full hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition-colors"
                      title="즐겨찾기"
                    >
                      <Star
                        className={`w-5 h-5 ${currentWord.isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Center of front: Giant Hanja */}
                <div className="my-auto text-center">
                  <div className="font-hanja text-8xl sm:text-9xl text-stone-900 tracking-tight transition-transform group-hover:scale-105 duration-200 drop-shadow-xs">
                    {currentWord.hanja}
                  </div>
                  <p className="mt-4 text-xs font-medium text-stone-400 flex items-center justify-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
                    카드를 누르면 훈음(뜻/음)과 해설이 뒤집힙니다 (Space)
                  </p>
                </div>

                {/* Footer of front */}
                <div className="flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-100">
                  <span>어문회 4급 배정</span>
                  <span className="font-medium text-amber-800">터치하여 뒤집기 👆</span>
                </div>
              </div>

              {/* CARD BACK (훈음, 예문, 해설) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-stone-900 text-stone-100 border-2 border-amber-900/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
                {/* Header of back */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-hanja text-3xl font-bold text-amber-400">
                      {currentWord.hanja}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                      부수 {currentWord.radical} &bull; {currentWord.strokes}획
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={speakHanja}
                      className="p-1.5 rounded-full hover:bg-stone-800 text-amber-400 transition-colors"
                      title="음성 읽기"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(currentWord.id);
                      }}
                      className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-amber-400 transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 ${currentWord.isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Center of back: Meaning, Sound, Vocabulary, Example */}
                <div className="my-3 space-y-4">
                  <div className="text-center py-2 bg-stone-800/80 rounded-xl border border-stone-700/60">
                    <span className="text-xs text-stone-400 block mb-0.5">훈음 (뜻과 소리)</span>
                    <h3 className="text-2xl sm:text-3xl font-bold text-amber-200 tracking-wide">
                      {currentWord.meaning}
                    </h3>
                  </div>

                  {/* Vocabulary words */}
                  {currentWord.words && (
                    <div>
                      <div className="text-xs text-amber-400/90 font-semibold mb-1.5 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>주요 활용 어휘</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {currentWord.words.split(',').map((w, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-md bg-stone-800 text-stone-200 border border-stone-700 font-medium"
                          >
                            {w.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Example sentence */}
                  {currentWord.example && (
                    <div className="bg-stone-800/60 p-3 rounded-lg border border-stone-700/50">
                      <div className="text-xs text-stone-400 font-medium mb-1">실생활 예문</div>
                      <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                        {currentWord.example}
                      </p>
                    </div>
                  )}

                  {/* Etymology / Notes */}
                  {currentWord.notes && (
                    <div className="text-xs text-stone-400 leading-relaxed italic flex items-start gap-1">
                      <Info className="w-3.5 h-3.5 mt-0.5 text-stone-500 shrink-0" />
                      <span>{currentWord.notes}</span>
                    </div>
                  )}
                </div>

                {/* Footer of back: AI Deep Dive button */}
                <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleFetchAiInsight}
                    disabled={isLoadingAi}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
                    <span>{isLoadingAi ? 'AI 해설 생성 중...' : 'Gemini AI 자원/암기팁 보기'}</span>
                  </button>

                  <span className="text-xs text-stone-500">클릭하여 다시 앞면으로</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insight Box (pops under if requested) */}
          {aiInsight && (
            <div className="w-full max-w-xl mt-4 p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-stone-800 text-xs sm:text-sm animate-fade-in shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Gemini AI 한자 훈장님의 암기 비법
                </span>
                <button
                  onClick={() => setAiInsight(null)}
                  className="text-stone-400 hover:text-stone-700 text-xs"
                >
                  닫기 ✕
                </button>
              </div>
              <p className="mb-2 leading-relaxed text-stone-700">{aiInsight.feedback}</p>
              {aiInsight.etymology && (
                <div className="mt-2 p-2 rounded-lg bg-white/80 border border-amber-200/60">
                  <span className="font-semibold text-amber-800">어원 & 부수: </span>
                  {aiInsight.etymology}
                </div>
              )}
              {aiInsight.mnemonics && (
                <div className="mt-2 p-2 rounded-lg bg-white/80 border border-amber-200/60">
                  <span className="font-semibold text-amber-800">연상 기억 팁: </span>
                  {aiInsight.mnemonics}
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={handlePrev}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 hover:border-stone-300 transition-all shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>이전 (←)</span>
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-5 py-2.5 rounded-xl bg-amber-700 text-white font-semibold text-sm hover:bg-amber-800 transition-all shadow-xs flex items-center gap-1.5"
            >
              <RotateCw className="w-4 h-4" />
              <span>뒤집기 (Space)</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 hover:border-stone-300 transition-all shadow-xs"
            >
              <span>다음 (→)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Grid Mode */}
      {displayMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {activeWords.map((word, idx) => (
            <div
              key={word.id}
              onClick={() => {
                setCurrentIndex(idx);
                setDisplayMode('single');
              }}
              className="bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all rounded-xl p-4 flex flex-col justify-between cursor-pointer group text-center"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                  {word.strokes}획
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(word.id);
                  }}
                  className="text-stone-300 hover:text-amber-500 p-0.5"
                >
                  <Star className={`w-3.5 h-3.5 ${word.isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                </button>
              </div>

              <div className="font-hanja text-5xl text-stone-900 group-hover:scale-105 transition-transform my-2">
                {word.hanja}
              </div>

              <div className="mt-1 pt-2 border-t border-stone-100">
                <div className="font-bold text-xs text-amber-900">{word.meaning}</div>
                <div className="text-[10px] text-stone-600 truncate mt-0.5">{word.words}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
