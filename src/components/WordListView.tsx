import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Star, 
  Eye, 
  EyeOff, 
  Volume2, 
  Download, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { HanjaItem } from '../types/hanja';

interface WordListViewProps {
  words: HanjaItem[];
  onAddWord: (word: Partial<HanjaItem>) => Promise<boolean>;
  onToggleBookmark: (id: string | number) => void;
  isSheetConnected: boolean;
}

export const WordListView: React.FC<WordListViewProps> = ({
  words,
  onAddWord,
  onToggleBookmark,
  isSheetConnected,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBookmark, setFilterBookmark] = useState(false);
  const [hideMeanings, setHideMeanings] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Word Form State
  const [newHanja, setNewHanja] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newRadical, setNewRadical] = useState('');
  const [newStrokes, setNewStrokes] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newWords, setNewWords] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtering
  const filteredWords = words.filter((item) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      item.hanja.includes(searchTerm.trim()) ||
      item.meaning.includes(searchTerm.trim()) ||
      item.words?.includes(searchTerm.trim()) ||
      item.example?.includes(searchTerm.trim()) ||
      item.radical?.includes(searchTerm.trim());

    const matchesBookmark = !filterBookmark || item.isBookmarked;

    return matchesSearch && matchesBookmark;
  });

  // Handle Add Word Submit
  const handleSubmitNewWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHanja.trim() || !newMeaning.trim()) {
      setSubmitMessage({ type: 'error', text: '한자와 훈음은 필수 입력 항목입니다.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const success = await onAddWord({
        hanja: newHanja.trim(),
        meaning: newMeaning.trim(),
        radical: newRadical.trim() || '정보 없음',
        strokes: Number(newStrokes) || 0,
        example: newExample.trim(),
        words: newWords.trim(),
        date: new Date().toISOString().slice(0, 10),
      });

      if (success) {
        setSubmitMessage({
          type: 'success',
          text: isSheetConnected
            ? `'${newHanja}' 한자가 단어장 및 구글 시트에 저장되었습니다!`
            : `'${newHanja}' 한자가 단어장에 등록되었습니다.`,
        });
        // Clear fields
        setNewHanja('');
        setNewMeaning('');
        setNewRadical('');
        setNewStrokes('');
        setNewExample('');
        setNewWords('');
        setTimeout(() => {
          setIsAddModalOpen(false);
          setSubmitMessage(null);
        }, 1500);
      } else {
        setSubmitMessage({ type: 'error', text: '단어 추가에 실패했습니다.' });
      }
    } catch {
      setSubmitMessage({ type: 'error', text: '오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // TTS helper
  const speak = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ko-KR';
        window.speechSynthesis.speak(u);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'ID,한자,훈음,부수,획수,예문,활용단어,등록일\n';
    const rows = words
      .map(
        (w) =>
          `"${w.id}","${w.hanja}","${w.meaning}","${w.radical}","${w.strokes}","${w.example.replace(/"/g, '""')}","${w.words.replace(/"/g, '""')}","${w.date || ''}"`
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `4급_한자_단어장_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="한자, 훈음(뜻/음), 부수, 어휘로 검색..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterBookmark(!filterBookmark)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              filterBookmark
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterBookmark ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>중요</span>
          </button>

          <button
            onClick={() => setHideMeanings(!hideMeanings)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              hideMeanings
                ? 'bg-amber-700 text-white border-amber-700'
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
            title="자가 테스트를 위해 뜻 가리기"
          >
            {hideMeanings ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{hideMeanings ? '뜻 가림 해제' : '뜻 가리기(암기 테스트)'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2 rounded-lg text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-colors"
            title="CSV로 내보내기"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>새 한자 추가</span>
          </button>
        </div>
      </div>

      {/* Header Count info */}
      <div className="flex items-center justify-between text-xs text-stone-500 px-1">
        <span>
          총 <strong className="text-stone-800">{filteredWords.length}</strong>개 한자
          {searchTerm && ` ('${searchTerm}' 검색 결과)`}
        </span>
        {isSheetConnected && (
          <span className="flex items-center gap-1 text-emerald-800 font-medium">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            구글 시트 실시간 동기화 활성
          </span>
        )}
      </div>

      {/* Words Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold">
              <tr>
                <th className="py-3 px-3 text-center w-12">중요</th>
                <th className="py-3 px-4 w-24">한자</th>
                <th className="py-3 px-4">훈음 (뜻과 소리)</th>
                <th className="py-3 px-3 w-24 hidden md:table-cell">부수 / 획수</th>
                <th className="py-3 px-4 hidden lg:table-cell">주요 활용 어휘</th>
                <th className="py-3 px-4 hidden sm:table-cell">예문</th>
                <th className="py-3 px-3 text-center w-14">듣기</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredWords.map((word) => (
                <tr key={word.id} className="hover:bg-amber-50/40 transition-colors">
                  {/* Bookmark Star */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => onToggleBookmark(word.id)}
                      className="p-1 text-stone-300 hover:text-amber-500 transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 ${word.isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`}
                      />
                    </button>
                  </td>

                  {/* Hanja */}
                  <td className="py-3.5 px-4 font-hanja text-3xl font-bold text-stone-900">
                    {word.hanja}
                  </td>

                  {/* Meaning (Blind test toggleable) */}
                  <td className="py-3.5 px-4">
                    {hideMeanings ? (
                      <span className="inline-block px-3 py-1 bg-stone-200 text-stone-400 rounded cursor-pointer hover:bg-stone-300 select-none text-xs">
                        클릭하여 보기
                      </span>
                    ) : (
                      <span className="font-bold text-amber-900 text-sm sm:text-base">
                        {word.meaning}
                      </span>
                    )}
                  </td>

                  {/* Radical / Strokes */}
                  <td className="py-3.5 px-3 hidden md:table-cell text-stone-600">
                    <div className="font-medium">{word.radical}</div>
                    <div className="text-[11px] text-stone-600">{word.strokes}획</div>
                  </td>

                  {/* Words */}
                  <td className="py-3.5 px-4 hidden lg:table-cell text-stone-700">
                    <div className="line-clamp-2">{word.words}</div>
                  </td>

                  {/* Example */}
                  <td className="py-3.5 px-4 hidden sm:table-cell text-stone-600 text-xs">
                    <div className="line-clamp-2 italic">{word.example}</div>
                  </td>

                  {/* Audio */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => speak(`${word.meaning}. ${word.words}`)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
                      title="발음 듣기"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredWords.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    검색 조건에 일치하는 한자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Hanja Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  +
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">새 한자 단어 추가</h3>
                  <p className="text-xs text-stone-500">
                    {isSheetConnected
                      ? '등록 시 구글 스프레드시트에 자동으로 새 행이 추가됩니다.'
                      : '로컬 단어장에 저장됩니다.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {submitMessage && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  submitMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {submitMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{submitMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNewWord} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    한자 (Hanja) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newHanja}
                    onChange={(e) => setNewHanja(e.target.value)}
                    placeholder="예: 結"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg font-hanja text-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    훈음 (뜻과 소리) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMeaning}
                    onChange={(e) => setNewMeaning(e.target.value)}
                    placeholder="예: 맺을 결"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">부수</label>
                  <input
                    type="text"
                    value={newRadical}
                    onChange={(e) => setNewRadical(e.target.value)}
                    placeholder="예: 糸(실사)"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">획수</label>
                  <input
                    type="number"
                    value={newStrokes}
                    onChange={(e) => setNewStrokes(e.target.value)}
                    placeholder="예: 12"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">주요 활용 어휘</label>
                <input
                  type="text"
                  value={newWords}
                  onChange={(e) => setNewWords(e.target.value)}
                  placeholder="예: 결과(結果), 결혼(結婚), 결합(結合)"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">실생활 예문</label>
                <textarea
                  rows={2}
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="예: 오랜 노력의 끝에 보람찬 결실을 맺었다."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg font-medium text-stone-600 hover:bg-stone-50 text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-700 text-white rounded-lg font-bold hover:bg-amber-800 transition-colors text-xs flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmitting ? '저장 중...' : isSheetConnected ? '구글 시트에 등록 (POST)' : '단어장에 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
