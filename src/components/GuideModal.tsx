import React, { useState } from 'react';
import { Copy, Check, ExternalLink, HelpCircle, AlertTriangle, Sparkles, FileSpreadsheet, Code2 } from 'lucide-react';
import { APPS_SCRIPT_TEMPLATE } from '../services/sheetsService';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, onOpenSettings }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedHeaders, setCopiedHeaders] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyHeaders = async () => {
    try {
      await navigator.clipboard.writeText('ID\t한자\t훈음\t부수\t획수\t예문\t활용단어\t등록일');
      setCopiedHeaders(true);
      setTimeout(() => setCopiedHeaders(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 my-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-700 text-white flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                초보자를 위한 구글 스프레드시트 연동 가이드
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                구글 시트를 무료 클라우드 DB로 사용하여 5분 만에 단어장 & 방명록을 연결해보세요!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Step by Step Container */}
        <div className="space-y-6 text-xs sm:text-sm text-stone-700">
          {/* STEP 1 */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-700 text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                구글 스프레드시트 생성 및 첫 행(헤더) 입력
              </span>
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-amber-700 hover:underline font-semibold"
              >
                <span>새 구글 시트 만들기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-stone-600 text-xs">
              구글 드라이브에서 새 스프레드시트를 만들고 <strong>1행(A1~H1)</strong>에 아래 열 이름을 차례대로 적어주세요:
            </p>

            <div className="bg-white p-2.5 rounded-lg border border-stone-200 flex items-center justify-between gap-2 overflow-x-auto">
              <code className="text-xs text-amber-950 font-mono whitespace-nowrap">
                ID | 한자 | 훈음 | 부수 | 획수 | 예문 | 활용단어 | 등록일
              </code>
              <button
                onClick={handleCopyHeaders}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-stone-100 hover:bg-stone-200 text-stone-700 shrink-0 font-medium transition-colors"
              >
                {copiedHeaders ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHeaders ? '복사됨!' : '헤더 복사'}</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-500">
              * 시트 탭 이름을 <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">HanjaWords</code> 로 지정하면 더 안전합니다 (기본 시트도 가능).
            </p>
          </div>

          {/* STEP 2 */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="font-bold text-amber-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-700 text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              확장 프로그램 &gt; Apps Script 열기
            </div>
            <p className="text-stone-600 text-xs leading-relaxed">
              스프레드시트 상단 메뉴에서 <strong>[확장 프로그램] ➔ [Apps Script]</strong>를 클릭하세요. 브라우저에 새로운 코드 편집창이 열립니다.
            </p>
          </div>

          {/* STEP 3 */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-700 text-white text-xs flex items-center justify-center font-bold">
                  3
                </span>
                Apps Script 코드 복사 &amp; 붙여넣기 (doGet &amp; doPost)
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold transition-colors shadow-xs"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? '전체 코드 복사 완료!' : '스크립트 코드 복사'}</span>
              </button>
            </div>

            <p className="text-stone-600 text-xs">
              Apps Script 창에 있는 기존 내용(<code className="bg-stone-200 px-1 py-0.5 rounded">function myFunction() ...</code>)을 모두 지우고 아래 완성 코드를 그대로 붙여넣은 뒤 <strong>저장(Ctrl+S)</strong>하세요.
            </p>

            <div className="relative">
              <pre className="bg-stone-900 text-stone-100 p-3.5 rounded-lg text-xs font-mono max-h-48 overflow-y-auto leading-relaxed scrollbar-thin">
                {APPS_SCRIPT_TEMPLATE}
              </pre>
            </div>
          </div>

          {/* STEP 4 */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-3">
            <div className="font-bold text-amber-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-800 text-white text-xs flex items-center justify-center font-bold">
                4
              </span>
              웹 앱으로 배포하기 (★ 가장 중요한 단계!)
            </div>

            <div className="space-y-2 text-xs text-amber-950 leading-relaxed">
              <p>
                1. Apps Script 우측 상단의 파란색 <strong>[배포(Deploy)]</strong> 버튼 클릭 ➔ <strong>[새 배포(New deployment)]</strong> 선택
              </p>
              <p>
                2. 왼쪽 톱니바퀴 아이콘을 눌러 <strong>[웹 앱(Web app)]</strong> 유형 선택
              </p>
              <p>
                3. 설명: <code className="bg-amber-200/60 px-1 py-0.5 rounded">한자 단어장 API</code>
              </p>
              <p>
                4. 다음 사용자 권한으로 실행: <strong>나(Me)</strong>
              </p>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>액세스 권한 설정 주의:</strong> 반드시 <strong>[모든 사용자(Anyone)]</strong>로 선택하셔야 로그인 없이 데이터를 읽고 쓸 수 있습니다! ('나만'으로 두면 접근 오류가 발생합니다)
                </div>
              </div>
              <p>
                5. [배포] 버튼을 누르고 권한 검토(Review Permissions) 창이 나오면 본인 구글 계정을 선택하여 허용하세요.
              </p>
            </div>
          </div>

          {/* STEP 5 */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="font-bold text-amber-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-700 text-white text-xs flex items-center justify-center font-bold">
                5
              </span>
              웹 앱 URL을 우리 웹앱에 등록!
            </div>
            <p className="text-stone-600 text-xs leading-relaxed">
              배포 완료 후 나타나는 <strong>웹 앱 URL (https://script.google.com/macros/s/.../exec)</strong>을 복사하여 아래 [구글 시트 연동 설정] 버튼을 누르고 붙여넣으면 끝납니다!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200">
          <div className="text-xs text-stone-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>설정이 끝나셨나요? URL을 등록하여 바로 연결해보세요.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg text-xs font-semibold"
            >
              닫기
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="w-full sm:w-auto px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              구글 시트 URL 입력하기 ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
