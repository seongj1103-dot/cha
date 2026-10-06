import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RefreshCw, 
  Trophy, 
  Flame, 
  HelpCircle,
  ArrowRight,
  BookOpen,
  Volume2
} from 'lucide-react';
import { HanjaItem, QuizQuestion, QuizMode, AiFeedback } from '../types/hanja';
import { requestAiFeedback } from '../services/aiService';

interface QuizViewProps {
  words: HanjaItem[];
  onAddGuestbookScore?: (score: number, hanjaSummary: string) => void;
  onBookmarkHanja?: (id: string | number) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ words, onAddGuestbookScore, onBookmarkHanja }) => {
  const [mode, setMode] = useState<QuizMode>('hanja-to-meaning');
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [questionCount, setQuestionCount] = useState(1);
  const [maxQuestions] = useState(10);
  const [quizFinished, setQuizFinished] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<{ question: QuizQuestion; chosen: string }[]>([]);
  
  // AI Feedback state
  const [aiFeedback, setAiFeedback] = useState<AiFeedback | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Helper to generate a question
  const generateQuestion = useCallback(
    (targetWords: HanjaItem[], selectedMode: QuizMode): QuizQuestion | null => {
      if (targetWords.length < 4) return null;

      // Pick a random target Hanja
      const targetIndex = Math.floor(Math.random() * targetWords.length);
      const target = targetWords[targetIndex];

      // Pick 3 random distractors distinct from target
      const pool = targetWords.filter((w) => w.id !== target.id);
      const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
      const distractors = shuffledPool.slice(0, 3);

      if (selectedMode === 'hanja-to-meaning') {
        const options = [target.meaning, ...distractors.map((d) => d.meaning)].sort(
          () => 0.5 - Math.random()
        );
        return {
          id: `q-${Date.now()}`,
          targetHanja: target,
          mode: selectedMode,
          questionText: `다음 한자 '${target.hanja}'의 올바른 훈음(뜻과 소리)은 무엇일까요?`,
          options,
          correctAnswer: target.meaning,
          explanation: `'${target.hanja}'의 훈음은 [${target.meaning}]입니다. (부수: ${target.radical}, ${target.strokes}획)`,
        };
      } else if (selectedMode === 'meaning-to-hanja') {
        const options = [target.hanja, ...distractors.map((d) => d.hanja)].sort(
          () => 0.5 - Math.random()
        );
        return {
          id: `q-${Date.now()}`,
          targetHanja: target,
          mode: selectedMode,
          questionText: `훈음 '${target.meaning}'에 해당하는 올바른 한자를 고르세요.`,
          options,
          correctAnswer: target.hanja,
          explanation: `'${target.meaning}'의 한자는 [${target.hanja}]입니다. 부수는 [${target.radical}], 획수는 ${target.strokes}획입니다.`,
        };
      } else {
        // Sentence blank mode
        const sentence = target.example || `${target.words} 관련 예문`;
        const blankSentence = sentence.replace(new RegExp(target.hanja, 'g'), '[ ? ]');
        const options = [target.hanja, ...distractors.map((d) => d.hanja)].sort(
          () => 0.5 - Math.random()
        );
        return {
          id: `q-${Date.now()}`,
          targetHanja: target,
          mode: selectedMode,
          questionText: `다음 문장의 빈칸 [ ? ]에 들어갈 알맞은 한자는?\n"${blankSentence}"`,
          options,
          correctAnswer: target.hanja,
          explanation: `원문: "${target.example}"\n정답은 [${target.hanja}](${target.meaning})입니다.`,
        };
      }
    },
    []
  );

  // Initialize first question
  useEffect(() => {
    if (words.length >= 4) {
      const q = generateQuestion(words, mode);
      setCurrentQuestion(q);
      setSelectedOption(null);
      setIsAnswered(false);
      setAiFeedback(null);
    }
  }, [words, mode, generateQuestion]);

  // Handle Option Click
  const handleSelectOption = async (option: string) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === currentQuestion.correctAnswer;

    if (isCorrect) {
      setScore((prev) => prev + 10);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
      setWrongAnswers((prev) => [...prev, { question: currentQuestion, chosen: option }]);
    }

    // Call Gemini AI Feedback
    setIsLoadingAi(true);
    try {
      const feedback = await requestAiFeedback({
        hanja: currentQuestion.targetHanja.hanja,
        meaning: currentQuestion.targetHanja.meaning,
        isCorrect,
        selectedAnswer: option,
        correctAnswer: currentQuestion.correctAnswer,
        radical: currentQuestion.targetHanja.radical,
        strokes: currentQuestion.targetHanja.strokes,
        example: currentQuestion.targetHanja.example,
        words: currentQuestion.targetHanja.words,
      });
      setAiFeedback(feedback);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Next Question or Finish
  const handleNextQuestion = () => {
    if (questionCount >= maxQuestions) {
      setQuizFinished(true);
      return;
    }

    const nextQ = generateQuestion(words, mode);
    setCurrentQuestion(nextQ);
    setSelectedOption(null);
    setIsAnswered(false);
    setAiFeedback(null);
    setQuestionCount((prev) => prev + 1);
  };

  // Restart Quiz
  const handleRestartQuiz = () => {
    setScore(0);
    setStreak(0);
    setQuestionCount(1);
    setQuizFinished(false);
    setWrongAnswers([]);
    const nextQ = generateQuestion(words, mode);
    setCurrentQuestion(nextQ);
    setSelectedOption(null);
    setIsAnswered(false);
    setAiFeedback(null);
  };

  // Speech helper
  const speakCurrent = () => {
    if (!currentQuestion) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(
          `${currentQuestion.targetHanja.hanja}. ${currentQuestion.targetHanja.meaning}`
        );
        u.lang = 'ko-KR';
        window.speechSynthesis.speak(u);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  if (words.length < 4) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-6">
        <HelpCircle className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-stone-700">단어가 4개 이상 필요합니다</h3>
        <p className="text-sm text-stone-500 mt-1">
          4지선다형 퀴즈를 출제하기 위해 최소 4개의 단어가 필요합니다. 단어장 탭에서 단어를 추가해주세요.
        </p>
      </div>
    );
  }

  // Quiz Finish Result Screen
  if (quizFinished) {
    const percentage = Math.round((score / (maxQuestions * 10)) * 100);
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-stone-200 shadow-md p-6 sm:p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
          <Trophy className="w-8 h-8 text-amber-700" />
        </div>

        <div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 text-stone-700">
            4급 한자 퀴즈 완료
          </span>
          <h2 className="text-2xl font-bold text-stone-900 mt-2">수고하셨습니다!</h2>
          <p className="text-sm text-stone-500 mt-1">
            총 {maxQuestions}문제 중 {score / 10}문제를 맞히셨습니다.
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-200 flex justify-around">
          <div>
            <div className="text-xs text-stone-500">최종 점수</div>
            <div className="text-3xl font-extrabold text-amber-800">{score}점</div>
          </div>
          <div className="border-r border-stone-200" />
          <div>
            <div className="text-xs text-stone-500">정답률</div>
            <div className="text-3xl font-extrabold text-stone-800">{percentage}%</div>
          </div>
          <div className="border-r border-stone-200" />
          <div>
            <div className="text-xs text-stone-500">오답 수</div>
            <div className="text-3xl font-extrabold text-rose-600">{wrongAnswers.length}개</div>
          </div>
        </div>

        {/* Wrong answer list */}
        {wrongAnswers.length > 0 && (
          <div className="text-left space-y-2">
            <h4 className="text-xs font-bold text-stone-700">오답 복습 노트 ({wrongAnswers.length}개)</h4>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {wrongAnswers.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-rose-50/60 border border-rose-200 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-hanja text-2xl font-bold text-rose-900">
                      {item.question.targetHanja.hanja}
                    </span>
                    <div>
                      <div className="font-semibold text-stone-800">
                        {item.question.targetHanja.meaning}
                      </div>
                      <div className="text-stone-500 text-[11px]">
                        선택: <span className="text-rose-600 line-through">{item.chosen}</span> &bull; 정답: <span className="text-emerald-700 font-semibold">{item.question.correctAnswer}</span>
                      </div>
                    </div>
                  </div>
                  {onBookmarkHanja && (
                    <button
                      onClick={() => onBookmarkHanja(item.question.targetHanja.id)}
                      className="px-2 py-1 text-[11px] bg-white border border-stone-200 rounded hover:bg-stone-50"
                    >
                      ★ 중요 보관
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleRestartQuiz}
            className="w-full py-3 bg-amber-700 text-white rounded-xl font-bold text-sm hover:bg-amber-800 transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>새 퀴즈 도전하기</span>
          </button>

          {onAddGuestbookScore && (
            <button
              onClick={() => {
                onAddGuestbookScore(score, `${words.length}개 4급 한자 퀴즈 완료 (${percentage}%)`);
              }}
              className="w-full py-3 bg-white text-stone-700 border border-stone-300 rounded-xl font-semibold text-sm hover:bg-stone-50 transition-colors"
            >
              방명록에 기록 남기기 📝
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Quiz Top bar: Mode selection & Stats */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Mode selector */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => {
              setMode('hanja-to-meaning');
              handleRestartQuiz();
            }}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              mode === 'hanja-to-meaning'
                ? 'bg-white shadow-xs font-bold text-stone-900'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            한자 ➡️ 훈음
          </button>
          <button
            onClick={() => {
              setMode('meaning-to-hanja');
              handleRestartQuiz();
            }}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              mode === 'meaning-to-hanja'
                ? 'bg-white shadow-xs font-bold text-stone-900'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            훈음 ➡️ 한자
          </button>
          <button
            onClick={() => {
              setMode('sentence-blank');
              handleRestartQuiz();
            }}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              mode === 'sentence-blank'
                ? 'bg-white shadow-xs font-bold text-stone-900'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            예문 빈칸
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 font-semibold text-amber-900">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>{score}점</span>
          </div>

          {streak > 1 && (
            <div className="flex items-center gap-1 font-bold text-orange-600 animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              <span>{streak}연속 정답!</span>
            </div>
          )}

          <div className="text-stone-500">
            문제 {questionCount} / {maxQuestions}
          </div>
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-md space-y-6">
          {/* Target Hanja Display */}
          <div className="text-center py-4 bg-stone-50 rounded-xl border border-stone-100 relative">
            <button
              onClick={speakCurrent}
              className="absolute top-3 right-3 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200"
              title="발음 듣기"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {mode === 'hanja-to-meaning' ? (
              <div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 font-semibold mb-2 inline-block">
                  부수: {currentQuestion.targetHanja.radical} &bull; {currentQuestion.targetHanja.strokes}획
                </span>
                <div className="font-hanja text-7xl sm:text-8xl text-stone-900 font-semibold my-2">
                  {currentQuestion.targetHanja.hanja}
                </div>
              </div>
            ) : mode === 'meaning-to-hanja' ? (
              <div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold mb-2 inline-block">
                  부수 {currentQuestion.targetHanja.radical}
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-stone-900 my-2">
                  {currentQuestion.targetHanja.meaning}
                </div>
              </div>
            ) : (
              <div className="px-4">
                <span className="text-xs px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 font-semibold mb-3 inline-block">
                  문맥 추론 빈칸 퀴즈
                </span>
                <p className="text-base sm:text-lg font-medium text-stone-800 leading-relaxed">
                  {currentQuestion.questionText}
                </p>
              </div>
            )}

            <p className="text-xs text-stone-500 mt-2 font-medium">
              {mode !== 'sentence-blank' && currentQuestion.questionText}
            </p>
          </div>

          {/* 4 Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQuestion.correctAnswer;

              let btnStyle = 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200';

              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-md font-bold';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-rose-500 text-white border-rose-600 shadow-md font-bold';
                } else {
                  btnStyle = 'bg-stone-100 text-stone-400 border-stone-200 opacity-60';
                }
              }

              const isHanjaOption = mode === 'meaning-to-hanja' || mode === 'sentence-blank';

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(option)}
                  className={`p-4 rounded-xl border-2 text-left font-medium transition-all flex items-center justify-between ${btnStyle} ${
                    isHanjaOption ? 'font-hanja text-3xl sm:text-4xl justify-center text-center' : 'text-sm sm:text-base'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {!isHanjaOption && (
                      <span className="w-6 h-6 rounded-full bg-white/40 text-xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                    )}
                    <span>{option}</span>
                  </div>

                  {isAnswered && (
                    <div>
                      {isCorrect && <CheckCircle2 className="w-5 h-5 text-white" />}
                      {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-white" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Result & Gemini AI Feedback Area */}
          {isAnswered && (
            <div className="space-y-4 pt-2 border-t border-stone-100 animate-fade-in">
              {/* Immediate Result Banner */}
              <div
                className={`p-4 rounded-xl flex items-start gap-3 ${
                  selectedOption === currentQuestion.correctAnswer
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-900'
                }`}
              >
                {selectedOption === currentQuestion.correctAnswer ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {selectedOption === currentQuestion.correctAnswer
                      ? '정답입니다! 🎉'
                      : `아쉽습니다! 정답은 '${currentQuestion.correctAnswer}'입니다.`}
                  </div>
                  <div className="text-xs mt-1 leading-relaxed opacity-90">
                    {currentQuestion.explanation}
                  </div>
                </div>
              </div>

              {/* Gemini AI Feedback Card */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 sm:p-5 text-stone-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Gemini AI 한자 훈장님의 실시간 맞춤 피드백</span>
                    {isLoadingAi && <span className="text-[10px] text-amber-600 animate-pulse">(분석 중...)</span>}
                  </div>
                  {aiFeedback?.isAiGenerated && (
                    <span className="text-[10px] px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full font-medium">
                      Gemini 3.8 Flash
                    </span>
                  )}
                </div>

                {isLoadingAi ? (
                  <div className="py-3 flex items-center justify-center gap-2 text-xs text-amber-800">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                    <span>AI가 한자의 어원과 맞춤 암기 비법을 분석하고 있습니다...</span>
                  </div>
                ) : aiFeedback ? (
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p className="leading-relaxed text-stone-800 font-medium">{aiFeedback.feedback}</p>
                    
                    {aiFeedback.etymology && (
                      <div className="p-2.5 rounded-lg bg-white/80 border border-amber-200/60 text-xs">
                        <span className="font-bold text-amber-900">💡 자원/어원 해설: </span>
                        <span className="text-stone-700">{aiFeedback.etymology}</span>
                      </div>
                    )}

                    {aiFeedback.mnemonics && (
                      <div className="p-2.5 rounded-lg bg-white/80 border border-amber-200/60 text-xs">
                        <span className="font-bold text-amber-900">🧠 1초 연상 암기팁: </span>
                        <span className="text-stone-700">{aiFeedback.mnemonics}</span>
                      </div>
                    )}

                    {currentQuestion.targetHanja.words && (
                      <div className="text-[11px] text-stone-600 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-stone-400" />
                        <span>주요 활용 단어: {currentQuestion.targetHanja.words}</span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Next Question Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-3 rounded-xl bg-amber-700 text-white font-bold text-sm hover:bg-amber-800 transition-colors shadow-xs flex items-center gap-2"
                >
                  <span>{questionCount >= maxQuestions ? '결과 보기' : '다음 문제'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
