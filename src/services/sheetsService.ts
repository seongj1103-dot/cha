import { HanjaItem, GuestbookEntry } from '../types/hanja';

export const APPS_SCRIPT_TEMPLATE = `/**
 * ========================================================
 * 4급 한자 맞춤 단어장 & 방명록 연동 구글 앱스 스크립트 (GAS)
 * ========================================================
 * [사용법]
 * 1. 구글 스프레드시트 > 확장 프로그램 > Apps Script 클릭
 * 2. 기존 코드를 모두 지우고 아래 코드를 그대로 붙여넣기
 * 3. 저장(Ctrl+S) 후 우측 상단 [배포] > [새 배포] 클릭
 * 4. 유형: [웹 앱] 선택
 * 5. 액세스 권한: 반드시 [모든 사용자(Anyone)] 로 설정!
 * 6. 생성된 '웹 앱 URL'을 복사하여 우리 웹앱의 연동 설정에 입력
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("HanjaWords") || ss.getSheets()[0];
    
    // 만약 시트에 아무것도 없으면 기본 헤더와 샘플 1행 추가
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["ID", "한자", "훈음", "부수", "획수", "예문", "활용단어", "등록일"]);
      sheet.appendRow([1, "決", "결단할 결", "氵(삼수변)", 7, "신중한 결정을 내리다.", "결정, 결단, 해결", "2026-10-01"]);
    }
    
    var data = sheet.getDataRange().getValues();
    var words = [];
    
    // 첫 행(헤더) 제외하고 데이터 파싱
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[1]) continue; // 한자(B열)가 없으면 제외
      words.push({
        id: row[0] || i,
        hanja: String(row[1]),
        meaning: String(row[2] || ""),
        sound: String(row[2] || "").split(" ").pop() || "",
        radical: String(row[3] || ""),
        strokes: Number(row[4]) || 0,
        example: String(row[5] || ""),
        words: String(row[6] || ""),
        date: String(row[7] || "")
      });
    }

    // 방명록 시트(Guestbook) 확인
    var guestbookSheet = ss.getSheetByName("Guestbook");
    var guestbook = [];
    if (guestbookSheet && guestbookSheet.getLastRow() > 1) {
      var gData = guestbookSheet.getDataRange().getValues();
      for (var j = 1; j < gData.length; j++) {
        var gRow = gData[j];
        if (!gRow[0]) continue;
        guestbook.push({
          id: "guest-" + j,
          author: String(gRow[0]),
          hanja: String(gRow[1] || ""),
          message: String(gRow[2] || ""),
          score: Number(gRow[3]) || 100,
          createdAt: String(gRow[4] || "")
        });
      }
    }
    
    var output = {
      status: "success",
      count: words.length,
      words: words,
      guestbook: guestbook
    };
    
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    
    // 1. 방명록/학습기록 등록인 경우
    if (payload.type === "guestbook" || payload.action === "add_guestbook") {
      var gSheet = ss.getSheetByName("Guestbook");
      if (!gSheet) {
        gSheet = ss.insertSheet("Guestbook");
        gSheet.appendRow(["작성자", "목표한자", "소감/다짐", "점수", "등록일시"]);
      }
      var gData = payload.data || payload;
      gSheet.appendRow([
        gData.author || "익명 학습자",
        gData.hanja || "",
        gData.message || "",
        gData.score || 100,
        new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "방명록이 구글 시트에 등록되었습니다."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. 새 단어 추가인 경우
    var sheet = ss.getSheetByName("HanjaWords") || ss.getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["ID", "한자", "훈음", "부수", "획수", "예문", "활용단어", "등록일"]);
    }
    
    var item = payload.data || payload;
    var nextId = sheet.getLastRow();
    var todayStr = new Date().toLocaleDateString("ko-KR");
    
    sheet.appendRow([
      nextId,
      item.hanja || "",
      item.meaning || "",
      item.radical || "",
      item.strokes || "",
      item.example || "",
      item.words || "",
      item.date || todayStr
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "새 한자 단어가 구글 시트에 등록되었습니다.",
      id: nextId
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const fetchSheetData = async (url: string): Promise<{ words?: HanjaItem[]; guestbook?: GuestbookEntry[]; raw?: any }> => {
  if (!url) {
    throw new Error('구글 시트 웹앱 URL이 등록되어 있지 않습니다.');
  }

  // 1차: 서버 프록시를 통해 요청 (CORS & 리디렉션 이슈 방지)
  try {
    const proxyRes = await fetch('/api/sheets/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, method: 'GET' })
    });

    if (proxyRes.ok) {
      const result = await proxyRes.json();
      if (result.status === 'success' && result.data) {
        return parseGasResponse(result.data);
      }
    }
  } catch (err) {
    console.warn('Proxy fetch failed, attempting direct fetch...', err);
  }

  // 2차: 브라우저 직접 fetch 시도
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`HTTP 에러: ${response.status}`);
  }

  const data = await response.json();
  return parseGasResponse(data);
};

export const postSheetWord = async (url: string, item: Partial<HanjaItem>): Promise<any> => {
  const payload = {
    type: 'add_hanja',
    data: {
      ...item,
      date: item.date || new Date().toISOString().slice(0, 10)
    }
  };

  // 1차: 서버 프록시 시도
  try {
    const proxyRes = await fetch('/api/sheets/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, method: 'POST', data: payload })
    });

    if (proxyRes.ok) {
      const resData = await proxyRes.json();
      return resData.data || resData;
    }
  } catch (err) {
    console.warn('Proxy POST failed, trying direct POST...', err);
  }

  // 2차: 브라우저 직접 전송 (text/plain으로 preflight bypass)
  const response = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  return await response.json();
};

export const postGuestbookEntry = async (url: string, entry: Partial<GuestbookEntry>): Promise<any> => {
  const payload = {
    type: 'guestbook',
    data: entry
  };

  try {
    const proxyRes = await fetch('/api/sheets/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, method: 'POST', data: payload })
    });

    if (proxyRes.ok) {
      const resData = await proxyRes.json();
      return resData.data || resData;
    }
  } catch (err) {
    console.warn('Guestbook proxy POST failed...', err);
  }

  const response = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  return await response.json();
};

function parseGasResponse(data: any): { words?: HanjaItem[]; guestbook?: GuestbookEntry[]; raw?: any } {
  if (Array.isArray(data)) {
    return { words: data };
  }
  if (data && typeof data === 'object') {
    if (Array.isArray(data.words)) {
      return {
        words: data.words,
        guestbook: Array.isArray(data.guestbook) ? data.guestbook : []
      };
    }
    if (Array.isArray(data.data)) {
      return { words: data.data };
    }
  }
  return { raw: data };
}
