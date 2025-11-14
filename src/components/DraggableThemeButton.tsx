'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface DraggableThemeButtonProps {
  currentTheme: {
    name: string;
    backgroundColor: string;
    textColor: string;
  };
  onThemeSwitch: () => void;
}

export default function DraggableThemeButton({
  currentTheme,
  onThemeSwitch,
}: DraggableThemeButtonProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 画面の端にスナップする関数
  const snapToEdge = useCallback((x: number, y: number) => {
    const buttonSize = 40;
    const margin = 16;

    // ビューポートのサイズを取得
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 各端までの距離を計算
    const distanceToLeft = x;
    const distanceToRight = viewportWidth - x - buttonSize;
    const distanceToTop = y;
    const distanceToBottom = viewportHeight - y - buttonSize;

    // 最も近い端を見つける
    const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);

    let newX = x;
    let newY = y;

    if (minDistance === distanceToLeft) {
      // 左端にスナップ
      newX = margin;
    } else if (minDistance === distanceToRight) {
      // 右端にスナップ
      newX = viewportWidth - buttonSize - margin;
    } else if (minDistance === distanceToTop) {
      // 上端にスナップ
      newY = margin;
    } else if (minDistance === distanceToBottom) {
      // 下端にスナップ
      newY = viewportHeight - buttonSize - margin;
    }

    // 端の範囲内に収める
    newX = Math.max(margin, Math.min(newX, viewportWidth - buttonSize - margin));
    newY = Math.max(margin, Math.min(newY, viewportHeight - buttonSize - margin));

    return { x: newX, y: newY };
  }, []);

  // 初期位置を設定（画面右端にスナップ）
  useEffect(() => {
    if (!isInitialized) {
      const buttonSize = 40;
      const margin = 16;
      const initialX = window.innerWidth - buttonSize - margin;
      const initialY = (window.innerHeight - buttonSize) / 2;

      // ローカルストレージから保存された位置を復元
      const savedPosition = localStorage.getItem('themeButtonPosition');
      let targetPosition = { x: initialX, y: initialY };

      if (savedPosition) {
        try {
          const parsed = JSON.parse(savedPosition);
          // 画面サイズが変わっている可能性があるので、有効な範囲内かチェック
          if (
            parsed.x >= 0 &&
            parsed.x <= window.innerWidth - buttonSize &&
            parsed.y >= 0 &&
            parsed.y <= window.innerHeight - buttonSize
          ) {
            targetPosition = parsed;
          }
        } catch {
          // パースエラー時はデフォルト位置を使用
        }
      }

      // 必ず画面の端にスナップ
      const snappedPosition = snapToEdge(targetPosition.x, targetPosition.y);
      setPosition(snappedPosition);
      setIsInitialized(true);
    }
  }, [isInitialized, snapToEdge]);

  // ドラッグ開始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    setHasDragged(false); // ドラッグ開始時にリセット
  }, []);

  // タッチ開始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Safari対応: タッチイベントの処理を改善
    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();

    if (!buttonRef.current || e.touches.length === 0) return;

    const touch = e.touches[0];
    const rect = buttonRef.current.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    setHasDragged(false); // ドラッグ開始時にリセット
  }, []);

  // ドラッグ中
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // 位置が変わったらドラッグが発生したとマーク
      if (Math.abs(newX - position.x) > 2 || Math.abs(newY - position.y) > 2) {
        setHasDragged(true);
      }

      // 画面内に収める
      const buttonSize = 40;
      const clampedX = Math.max(0, Math.min(newX, window.innerWidth - buttonSize));
      const clampedY = Math.max(0, Math.min(newY, window.innerHeight - buttonSize));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Safari対応: タッチムーブイベントの処理を改善
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();

      if (e.touches.length === 0) return;

      const touch = e.touches[0];
      const newX = touch.clientX - dragOffset.x;
      const newY = touch.clientY - dragOffset.y;

      // 位置が変わったらドラッグが発生したとマーク
      if (Math.abs(newX - position.x) > 2 || Math.abs(newY - position.y) > 2) {
        setHasDragged(true);
      }

      // 画面内に収める
      const buttonSize = 40;
      const clampedX = Math.max(0, Math.min(newX, window.innerWidth - buttonSize));
      const clampedY = Math.max(0, Math.min(newY, window.innerHeight - buttonSize));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleEnd = () => {
      setIsDragging(false);

      // 端にスナップ
      const snappedPosition = snapToEdge(position.x, position.y);
      setPosition(snappedPosition);

      // 位置をローカルストレージに保存
      localStorage.setItem('themeButtonPosition', JSON.stringify(snappedPosition));
    };

    // イベントリスナーを追加（Safari対応のオプション設定）
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, {
      passive: false,
      capture: true,
    });
    document.addEventListener('touchend', handleEnd, {
      passive: false,
      capture: true,
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove, true);
      document.removeEventListener('touchend', handleEnd, true);
    };
  }, [isDragging, dragOffset, position, snapToEdge]);

  // クリック処理（ドラッグと区別）
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // ドラッグが発生していなければテーマ切り替え
      if (!hasDragged) {
        onThemeSwitch();
      }

      // クリック後にドラッグフラグをリセット
      setTimeout(() => {
        setHasDragged(false);
      }, 100);
    },
    [hasDragged, onThemeSwitch]
  );

  // 画面リサイズ時の位置調整
  useEffect(() => {
    const handleResize = () => {
      const buttonSize = 40;
      const margin = 16;

      // 現在の位置が画面外になっていないかチェック
      const maxX = window.innerWidth - buttonSize - margin;
      const maxY = window.innerHeight - buttonSize - margin;

      if (position.x > maxX || position.y > maxY) {
        const adjustedPosition = {
          x: Math.min(position.x, maxX),
          y: Math.min(position.y, maxY),
        };
        setPosition(adjustedPosition);
        localStorage.setItem('themeButtonPosition', JSON.stringify(adjustedPosition));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  if (!isInitialized) {
    return null;
  }

  return (
    <button
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      className={`cursor-pointer select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: currentTheme.backgroundColor,
        border: `2px solid ${currentTheme.backgroundColor === '#000000' || currentTheme.backgroundColor === '#265CAC' ? '#ffffff' : '#000000'}`,
        transition: isDragging ? 'none' : 'opacity 0.1s ease, transform 0.2s ease',
        zIndex: 9999,
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        opacity: isDragging ? 0.8 : 1,
        touchAction: 'manipulation', // Safari対応: manipulationに変更
        userSelect: 'none', // テキスト選択を無効化
        WebkitUserSelect: 'none', // Safari対応
        WebkitTouchCallout: 'none', // Safari対応: 長押しメニューを無効化
        WebkitTapHighlightColor: 'transparent', // Safari対応: タップハイライトを無効化
      }}
      title={`テーマ: ${currentTheme.name} (ドラッグで移動可能)`}
    />
  );
}
