import React, { useState } from 'react';
import { Settings, CheckCircle2, AlertCircle, RefreshCw, Unlink, HelpCircle, FileSpreadsheet } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  webAppUrl: string;
  onSaveUrl: (url: string) => Promise<{ success: boolean; message: string; count?: number }>;
  onDisconnect: () => void;
  onOpenGuide: () => void;
  onResetDemoData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  webAppUrl,
  onSaveUrl,
  onDisconnect,
  onOpenGuide,
  onResetDemoData,
}) => {
  const [urlInput, setUrlInput] = useState(webAppUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setTestResult({
        success: false,
        message: '구글 앱스 스크립트 웹앱 배포 URL을 입력해주세요.',
      });
      return;
    }

    if (!urlInput.startsWith('https://script.google.com/macros/s/')) {
      setTestResult({
        success: false,
        message:
          "올바른 구글 웹앱 URL 형식이 아닙니다. 'https://script.google.com/macros/s/.../exec' 형태인지 확인해주세요.",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await onSaveUrl(urlInput.trim());
    setIsTesting(false);
    setTestResult({
      success: result.success,
      message: result.message,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Settings className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">구글 시트 연동 설정</h3>
              <p className="text-xs text-stone-500">Google Apps Script 웹 앱 API 연동</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleTestAndSave} className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-stone-700 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>구글 앱스 스크립트 웹 앱 URL</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGuide();
                }}
                className="text-amber-800 hover:underline flex items-center gap-0.5 text-[11px]"
              >
                <HelpCircle className="w-3 h-3" />
                <span>URL 생성 가이드</span>
              </button>
            </div>

            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
            <p className="text-[11px] text-stone-600 mt-1">
              * Apps Script에서 [배포] &gt; [새 배포] &gt; 액세스 권한: <strong>모든 사용자(Anyone)</strong>로 설정한 웹 앱 URL
            </p>
          </div>

          {/* Result Alert */}
          {testResult && (
            <div
              className={`p-3.5 rounded-lg flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{testResult.message}</div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            {webAppUrl ? (
              <button
                type="button"
                onClick={() => {
                  onDisconnect();
                  setUrlInput('');
                  setTestResult({ success: true, message: '구글 시트 연동이 해제되었습니다.' });
                }}
                className="flex items-center gap-1 text-rose-600 hover:text-rose-800 font-medium py-1.5 px-2 rounded hover:bg-rose-50"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>연동 해제</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onResetDemoData();
                  setTestResult({
                    success: true,
                    message: '4급 필수 배정한자 기본 데이터셋으로 복원되었습니다.',
                  });
                }}
                className="text-stone-500 hover:text-stone-800 text-[11px] hover:underline"
              >
                기본 4급 데이터 복원
              </button>
            )}

            <button
              type="submit"
              disabled={isTesting}
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold transition-colors flex items-center gap-1.5 shadow-xs ml-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? '연결 확인 중...' : '연결 테스트 및 저장'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
