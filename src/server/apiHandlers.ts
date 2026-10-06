import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiInstance) {
    try {
      aiInstance = new GoogleGenAI();
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
    }
  }
  return aiInstance;
}

export async function handleAiFeedback(body: any) {
  const { hanja, meaning, isCorrect, selectedAnswer, correctAnswer, radical, strokes, example, words } = body || {};

  if (!hanja) {
    return {
      status: 400,
      data: { error: 'Hanja character is required' }
    };
  }

  const ai = getAiClient();

  // Fallback if no Gemini API key configured
  if (!ai || !process.env.GEMINI_API_KEY) {
    const fallbackMessage = isCorrect
      ? `🎉 정답입니다! '${hanja}'(${meaning})는 부수가 [${radical || '기본 부수'}], 획수는 [${strokes || '기본'}획]입니다. 활용 어휘: ${words || '기본 단어'}. 훌륭하게 암기하셨습니다!`
      : `💡 오답 노트: 선택하신 [${selectedAnswer || '답'}] 대신 정답은 [${correctAnswer || meaning}]입니다. '${hanja}'(${meaning})는 부수 [${radical || '부수'}]와 뜻을 유기적으로 연상하여 기억해보세요. 예문: "${example || '예문 참고'}".`;

    return {
      status: 200,
      data: {
        feedback: fallbackMessage,
        etymology: `'${hanja}'의 부수는 [${radical || '기본'}]로 이루어져 있으며, 4급 필수 한자입니다.`,
        mnemonics: `글자의 모양과 부수 [${radical || '부수'}]의 의미를 연결지어 기억해보세요!`,
        isAiGenerated: false
      }
    };
  }

  try {
    const prompt = `
당신은 한국 한자 교육 4급 수험생을 지도하는 친절하고 박식한 '한자 훈장님(AI 한자 멘토)'입니다.
학생이 4급 한자 퀴즈를 풀었습니다. 아래 정보를 바탕으로 학생에게 따뜻한 맞춤 피드백과 오답노트/암기 비법을 작성해주세요.

[학습 정보]
- 한자: ${hanja}
- 훈음(뜻과 소리): ${meaning}
- 부수: ${radical || '정보 없음'}
- 획수: ${strokes ? strokes + '획' : '정보 없음'}
- 예문: ${example || '정보 없음'}
- 주요 활용 단어: ${words || '정보 없음'}
- 정답 여부: ${isCorrect ? '정답 (맞춤)' : '오답 (틀림)'}
${!isCorrect ? `- 학생이 고른 답: ${selectedAnswer || '오답'}\n- 정답: ${correctAnswer || meaning}` : ''}

[요청 사항]
1. 정답이면 격려와 함께 한자의 깊은 뜻이나 기억 강화 꿀팁을 전해주세요.
2. 오답이면 따뜻하게 위로하며 헷갈리기 쉬운 이유, 올바른 훈음 구분법, 부수(${radical || ''})를 활용한 쉬운 연상 암기법(파자/스토리)을 알려주세요.
3. 실생활에서 자주 쓰이는 활용 어휘와 쉬운 예문을 곁들여주세요.
4. 존댓말로 친근하고 따뜻한 톤(이모지 포함)으로 3~4문장 내외로 간결하고 명확하게 답변해주세요.
5. JSON 포맷으로 응답해주세요:
{
  "feedback": "따뜻한 피드백 및 총평",
  "etymology": "한자의 자원/부수 해설 및 기억법",
  "mnemonics": "한 줄 암기 암기팁(비유나 연상)",
  "recommendedWords": "추천 활용 단어 2~3개"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { feedback: text, isAiGenerated: true };
    }

    return {
      status: 200,
      data: {
        ...parsed,
        isAiGenerated: true
      }
    };
  } catch (error: any) {
    console.error('Gemini API Error in handler:', error);
    return {
      status: 200, // Return 200 with fallback to avoid UI crash
      data: {
        feedback: isCorrect
          ? `정답입니다! '${hanja}'(${meaning})을(를) 정확히 맞히셨습니다.`
          : `아쉽게 틀렸습니다. 정답은 '${meaning}'입니다. 다시 한 번 복습해보세요!`,
        etymology: `'${hanja}'의 부수는 [${radical || '기본'}]입니다.`,
        isAiGenerated: false
      }
    };
  }
}

export async function handleSheetsProxy(body: any) {
  const { url, method = 'GET', data } = body || {};

  if (!url || typeof url !== 'string' || !url.startsWith('https://script.google.com/')) {
    return {
      status: 400,
      data: {
        status: 'error',
        message: '유효한 구글 앱스 스크립트 웹앱 URL(https://script.google.com/...)을 입력해주세요.'
      }
    };
  }

  try {
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      redirect: 'follow',
      headers: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    if (fetchOptions.method === 'POST') {
      fetchOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Content-Type': 'text/plain;charset=utf-8'
      };
    }

    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    let resultData: any;
    if (contentType.includes('application/json')) {
      resultData = await response.json();
    } else {
      const text = await response.text();
      try {
        resultData = JSON.parse(text);
      } catch {
        resultData = { raw: text };
      }
    }

    return {
      status: 200,
      data: {
        status: 'success',
        data: resultData
      }
    };
  } catch (error: any) {
    console.error('Sheets Proxy Error:', error);
    return {
      status: 502,
      data: {
        status: 'error',
        message: `구글 시트 연동 실패: ${error.message || '서버 통신 오류'}. 앱스 스크립트 배포 시 액세스 권한이 '모든 사용자(Anyone)'로 되어 있는지 확인해주세요.`
      }
    };
  }
}
