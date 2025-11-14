'use client';

import { useEffect, useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import TerminalStream from '@/components/TerminalStream';
import ThreeMemoryScene from '@/components/ThreeMemoryScene';
import DraggableThemeButton from '@/components/DraggableThemeButton';
import ActiveUsersCounter from '@/components/ActiveUsersCounter';
import { THEMES } from '@/lib/constants';

export default function Page() {
  const [showTerminal, setShowTerminal] = useState(false);
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0); // デフォルトをホワイトに設定（THEMES[0]）
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const currentTheme = THEMES[currentThemeIndex];

  useEffect(() => {
    // ローカルストレージからテーマを復元
    const savedThemeIndex = localStorage.getItem('themeIndex');
    if (savedThemeIndex) {
      const index = parseInt(savedThemeIndex, 10);
      if (index >= 0 && index < THEMES.length) {
        setCurrentThemeIndex(index);
      }
    }

    // 初期設定：モバイル判定
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    checkIsMobile();

    // ビューポートの高さを監視（キーボード表示対応）
    const updateViewportHeight = () => {
      const newHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;

      // モバイル判定を更新
      checkIsMobile();

      // キーボードが開いているかどうかを判定（高さが大幅に減った場合）
      const heightDifference = windowHeight - newHeight;
      const isKeyboardVisible = heightDifference > 150; // 150px以上の差があればキーボードが開いていると判定

      setIsKeyboardOpen(isKeyboardVisible);

      // スマホでターミナルが開いている時のスクロール制御
      const currentIsMobile = window.innerWidth <= 640;
      if (currentIsMobile && showTerminal) {
        if (isKeyboardVisible) {
          // キーボードが開いた時：ページスクロールを完全に無効化
          document.body.classList.add('no-scroll');
          document.documentElement.classList.add('no-scroll');
        } else {
          // キーボードが閉じた時：スクロール制御を解除
          document.body.classList.remove('no-scroll');
          document.documentElement.classList.remove('no-scroll');
        }
      }
    };

    // ビューポート変更の監視
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
    }
    window.addEventListener('resize', updateViewportHeight);

    // テーマ変更イベントを監視（ThreeMemorySceneからの変更を同期）
    const handleThemeChange = (e: CustomEvent) => {
      const newThemeIndex = e.detail.themeIndex;
      if (newThemeIndex >= 0 && newThemeIndex < THEMES.length) {
        setCurrentThemeIndex(newThemeIndex);
      }
    };

    window.addEventListener('themeChanged', handleThemeChange as EventListener);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
      }
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);

      // クリーンアップ時にスクロール制御を解除
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll');
    };
  }, [showTerminal]);

  // テーマ変更時にhtml/bodyの背景色を更新
  useEffect(() => {
    document.documentElement.style.backgroundColor = currentTheme.backgroundColor;
    document.body.style.backgroundColor = currentTheme.backgroundColor;
  }, [currentTheme.backgroundColor]);

  // テーマ切り替え機能
  const switchTheme = () => {
    const nextThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    setCurrentThemeIndex(nextThemeIndex);
    localStorage.setItem('themeIndex', nextThemeIndex.toString());

    // ThreeMemorySceneにテーマ変更を通知
    const event = new CustomEvent('themeChanged', {
      detail: { themeIndex: nextThemeIndex },
    });
    window.dispatchEvent(event);
  };

  // ターミナル表示/非表示の制御
  const toggleTerminal = () => {
    const newShowTerminal = !showTerminal;
    setShowTerminal(newShowTerminal);

    // スマホでターミナルを閉じた時はスクロール制御を解除
    if (isMobile && !newShowTerminal) {
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll');
    }
  };

  // 認証済みユーザーのみ表示
  return (
    <div
      className={`relative w-full h-screen overflow-hidden no-select no-tap-highlight ${showTerminal && isMobile ? 'no-scroll' : ''}`}
      style={{ backgroundColor: currentTheme.backgroundColor }}
    >
      {/* 3Dメモリシーン */}
      <div className={isKeyboardOpen && showTerminal ? 'canvas-no-interaction' : ''}>
        <ThreeMemoryScene />
      </div>

      {/* ロゴ（左上） */}
      <div className="fixed top-6 left-6 sm:absolute" style={{ zIndex: 9999 }}>
        <button
          onClick={() => (window.location.href = '/')}
          className="block hover:opacity-80 transition-opacity duration-150 active:scale-95 cursor-pointer font-mono"
          style={{
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 9999,
            color: currentTheme.textColor,
            fontSize: 'clamp(1rem, 4vw, 1.25rem)',
            fontWeight: '400',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-geist-mono)',
          }}
          aria-label="Cloud Atlas"
        >
          Cloud Atlas
        </button>
      </div>

      {/* アクティブユーザーカウンター */}
      <ActiveUsersCounter theme={currentTheme} />

      {/* コントロールパネル（スマホで固定表示） */}
      <div
        className="fixed top-4 right-4 flex flex-col gap-3 sm:gap-2 sm:absolute"
        style={{ zIndex: 9999 }}
      >
        {/* ポストボタン */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleTerminal();
          }}
          className="flex items-center justify-center min-h-[44px] sm:min-h-auto cursor-pointer hover:bg-gray-300 transition-colors duration-150"
          style={{
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 9999,
            background: showTerminal ? '#a0a0a0' : '#c0c0c0',
            border: showTerminal ? '2px inset #c0c0c0' : '2px outset #c0c0c0',
            color: '#000000',
            borderRadius: 0,
            width: '44px',
            height: '44px',
          }}
          onMouseDown={(e) => {
            if (!showTerminal) {
              e.currentTarget.style.border = '2px inset #c0c0c0';
            }
          }}
          onMouseUp={(e) => {
            if (!showTerminal) {
              e.currentTarget.style.border = '2px outset #c0c0c0';
            }
          }}
          onMouseLeave={(e) => {
            if (!showTerminal) {
              e.currentTarget.style.border = '2px outset #c0c0c0';
            }
          }}
        >
          <MessageSquarePlus size={20} />
        </button>
      </div>

      {/* ドラッグ可能なテーマ切り替えボタン */}
      <DraggableThemeButton currentTheme={currentTheme} onThemeSwitch={switchTheme} />

      {/* ターミナル（キーボード対応） */}
      {showTerminal && (
        <div
          className={`fixed left-0 right-0 sm:left-4 sm:right-4 sm:bottom-4 z-50 ${
            isKeyboardOpen ? 'terminal-fixed' : ''
          }`}
          style={{
            bottom: isMobile ? (isKeyboardOpen ? '0px' : '16px') : '16px',
            left: isMobile ? (isKeyboardOpen ? '0px' : '8px') : undefined,
            right: isMobile ? (isKeyboardOpen ? '0px' : '8px') : undefined,
            maxHeight: isKeyboardOpen ? '50vh' : '48vw',
            transform: 'translateZ(0)', // ハードウェアアクセラレーションを有効化
            willChange: 'transform', // パフォーマンス最適化
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <TerminalStream onClose={toggleTerminal} isKeyboardOpen={isKeyboardOpen} />
        </div>
      )}
    </div>
  );
}
