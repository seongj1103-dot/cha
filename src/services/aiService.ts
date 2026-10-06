import { HanjaItem, AiFeedback } from '../types/hanja';

export interface FeedbackRequest {
  hanja: string;
  meaning: string;
  isCorrect: boolean;
  selectedAnswer?: string;
  correctAnswer: string;
  radical?: string;
  strokes?: number;
  example?: string;
  words?: string;
}

export const requestAiFeedback = async (params: FeedbackRequest): Promise<AiFeedback> => {
  try {
    const response = await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        feedback: data.feedback || (params.isCorrect ? '정답입니다! 훌륭합니다.' : '오답입니다. 다시 복습해보세요.'),
        etymology: data.etymology,
        mnemonics: data.mnemonics,
        recommendedWords: data.recommendedWords,
        isAiGenerated: data.isAiGenerated ?? true
      };
    }
  } catch (error) {
    console.warn('AI feedback fetch failed, using smart offline explanation:', error);
  }

  // Graceful fallback
  return {
    feedback: params.isCorrect
      ? `🎉 정답입니다! '${params.hanja}'(${params.meaning})의 부수 [${params.radical || '기본 부수'}]와 획수를 잘 익히셨습니다. 활용 단어(${params.words || '어휘'})도 함께 기억해두면 시험에 큰 도움이 됩니다!`
      : `💡 오답 노트: 선택하신 [${params.selectedAnswer || '답'}] 대신 올바른 답은 [${params.correctAnswer}]입니다. '${params.hanja}'는 부수 [${params.radical || '부수'}]의 의미를 살려 연상하면 오래 기억할 수 있습니다. 예문: "${params.example || ''}"`,
    etymology: `'${params.hanja}'는 한국어문회 4급 필수 배정한자로, 부수는 [${params.radical || '부수'}]에 해당합니다.`,
    mnemonics: `글자의 부수 [${params.radical || '부수'}]와 소리 성분을 조합하여 한 편의 이야기처럼 연상해보세요.`,
    recommendedWords: params.words,
    isAiGenerated: false
  };
};
