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
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
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

  // テーマ切り替え機能
  const switchTheme = () => {
    const nextThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    setCurrentThemeIndex(nextThemeIndex);
    localStorage.setItem('themeIndex', nextThemeIndex.toString());
    
    // ThreeMemorySceneにテーマ変更を通知
    const event = new CustomEvent('themeChanged', {
      detail: { themeIndex: nextThemeIndex }
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
      <div 
        className="fixed top-4 left-4 sm:absolute" 
        style={{ zIndex: 9999 }}
      >
        <button
          onClick={() => window.location.href = '/'}
          className="block hover:opacity-80 transition-opacity duration-150 active:scale-95 cursor-pointer"
          style={{ 
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 9999
          }}
        >
          <svg 
            width="64" 
            height="38" 
            viewBox="0 0 362 218" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-auto sm:h-16"
            aria-label="POCARI Logo"
          >
            <g clipPath="url(#clip0_676_14764)">
              <path d="M361.588 147.35V212.3C353.558 213.23 345.548 214.72 337.498 215.54C282.898 221.12 232.098 215.89 179.978 199.32C122.008 180.89 74.1978 150.64 11.1278 150.62C9.97782 150.62 -0.00217999 150.88 0.00782001 150.32C20.2078 145.34 40.6478 140.18 61.4478 138.14C126.938 131.73 183.878 157.44 247.628 159.81C285.998 161.24 324.328 155.53 361.588 147.34V147.35Z" fill={currentTheme.textColor}/>
              <path d="M79.5819 63.4519L89.5919 103.512L100.392 63.4219L117.412 63.5119L127.742 103.512L136.952 63.4519H152.112L136.362 118.072L120.962 118.162L108.532 75.9019L96.8419 118.072L80.7319 118.052L64.4219 63.4519H79.5819Z" fill={currentTheme.textColor}/>
              <path d="M49.8028 78.6099H35.1928C34.9028 78.6099 35.4528 75.0899 33.3128 73.1799C26.2428 66.8799 14.4128 77.7599 25.2428 82.8799C33.2828 86.6799 47.8828 86.3499 51.0628 96.5799C54.2028 106.69 48.5128 115.25 38.7228 118.14C24.9028 122.23 4.87282 118.6 4.88282 100.81H19.4928C18.2328 110.14 32.7528 113.76 36.1228 105.81C40.2928 95.9899 21.2028 94.9999 15.3228 92.2499C4.21282 87.0599 3.07282 73.5399 13.0228 66.4699C23.6328 58.9399 51.0528 60.9699 49.7928 78.6199L49.8028 78.6099Z" fill={currentTheme.textColor}/>
              <path d="M205.7 63.4514V72.6514H183.24C183.18 72.6514 182.43 73.4014 182.43 73.4614V84.5614H204.08V94.3014H182.43V107.831H206.79V118.111H167.82V63.4414H205.71L205.7 63.4514Z" fill={currentTheme.textColor}/>
              <path d="M189.998 17.4415H175.658C175.158 17.4415 173.728 11.6715 168.928 10.6515C153.398 7.33152 152.098 32.8915 157.518 42.0915C162.328 50.2615 174.608 48.0815 175.938 38.5615H190.548C190.688 57.8515 163.318 61.1615 150.318 53.0815C136.198 44.3115 136.978 15.9415 149.408 5.81152C161.718 -4.22848 188.848 -1.77847 190.008 17.4515L189.998 17.4415Z" fill={currentTheme.textColor}/>
              <path d="M332.362 63.4492V73.7392H315.042V118.119H300.422V73.7392H283.102V63.4492H332.362Z" fill={currentTheme.textColor}/>
              <path d="M361.59 1.19922H346.43V55.8692H361.59V1.19922Z" fill={currentTheme.textColor}/>
              <path d="M312.867 28.7986C312.457 27.2086 314.457 27.7186 315.697 27.0386C321.637 23.8186 322.707 18.1286 322.057 11.7586C321.297 4.3086 314.327 1.8086 307.717 1.19859C297.657 0.268595 286.257 1.88859 276.047 1.19859V55.8686H291.207V34.7586H302.307C307.827 34.7586 305.227 52.8586 309.347 55.8686H324.237C318.587 47.2986 324.567 32.8886 312.867 28.7986ZM302.317 24.4786H291.217V10.9486H302.857C304.437 10.9486 306.247 12.5686 306.927 13.3786C309.967 16.9586 307.727 24.4486 302.317 24.4886V24.4786Z" fill={currentTheme.textColor}/>
              <path d="M91.9062 0.279588C74.0062 2.05959 66.2762 15.9196 67.6662 32.8596C70.2362 64.0996 114.616 64.7696 120.556 37.0496C125.046 16.0996 115.086 -2.02041 91.9062 0.279588ZM90.5462 46.2496C78.4862 41.6496 79.4462 12.5296 91.8662 9.98959C113.056 5.65959 111.046 54.0796 90.5462 46.2496Z" fill={currentTheme.textColor}/>
              <path d="M258.488 63.9808C258.068 63.4408 257.478 63.5008 256.878 63.4308C254.078 63.1008 246.068 63.0808 243.288 63.4308C242.628 63.5108 242.198 63.3908 241.688 64.0008C241.288 64.4808 239.508 69.3008 238.988 70.5108C232.308 86.0308 226.918 102.141 219.998 117.581C219.518 117.911 220.508 118.681 220.578 118.681H233.028C234.798 117.231 236.528 107.871 237.978 107.391L261.118 107.281C261.728 107.451 263.908 117.661 265.508 118.681H280.398L258.488 63.9908V63.9808ZM241.418 98.0908L249.798 74.8108L257.648 98.0908H241.408H241.418Z" fill={currentTheme.textColor}/>
              <path d="M239.546 1.16016L223.646 1.29016L201.906 55.8702H215.166L219.296 45.1202C222.266 45.4002 242.426 44.3802 243.096 45.3702L247.096 55.8802H262.526L239.546 1.16016ZM223.016 35.3102L231.406 11.4902L239.796 35.3102H223.016Z" fill={currentTheme.textColor}/>
              <path d="M47.6491 5.78922C44.8891 3.02922 39.3491 1.19922 34.9191 1.19922H7.03906V55.8692H22.1991V35.2992H36.5391C39.9191 35.2992 44.6191 33.0292 46.1891 31.9592C53.4891 26.9892 53.8591 11.9992 47.6491 5.78922ZM35.6891 23.6192C34.4791 24.8292 31.8591 25.5592 30.5891 25.5592H22.1991V10.9492H32.7591C37.5291 10.9492 39.0891 20.2192 35.6891 23.6192Z" fill={currentTheme.textColor}/>
            </g>
            <defs>
              <clipPath id="clip0_676_14764">
                <rect width="361.59" height="217.7" fill="white"/>
              </clipPath>
            </defs>
          </svg>
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
              height: '44px'
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
      <DraggableThemeButton
        currentTheme={currentTheme}
        onThemeSwitch={switchTheme}
      />

      {/* ターミナル（キーボード対応） */}
      {showTerminal && (
        <div 
          className={`fixed left-0 right-0 sm:left-4 sm:right-4 sm:bottom-4 z-50 ${
            isKeyboardOpen ? 'terminal-fixed' : ''
          }`}
          style={{
            bottom: isMobile
              ? (isKeyboardOpen ? '0px' : '16px')
              : '16px',
            left: isMobile
              ? (isKeyboardOpen ? '0px' : '8px')
              : undefined,
            right: isMobile
              ? (isKeyboardOpen ? '0px' : '8px')
              : undefined,
            maxHeight: isKeyboardOpen ? '50vh' : '48vw',
            transform: 'translateZ(0)', // ハードウェアアクセラレーションを有効化
            willChange: 'transform', // パフォーマンス最適化
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <TerminalStream 
            onClose={toggleTerminal}
            isKeyboardOpen={isKeyboardOpen}
          />
        </div>
      )}
    </div>
  );
}
