'use client';

import { useState, useEffect, useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TypingAnimationProps {
  text: string;
  position: [number, number, number];
  delay?: number;
  fontSize?: number;
  color?: string;
}

// ランダムな文字を生成する関数
const generateRandomChar = (): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  return chars[Math.floor(Math.random() * chars.length)];
};

export default function TypingAnimation({
  text,
  position,
  delay = 0,
  fontSize = 0.5,
  color = '#ffffff',
}: TypingAnimationProps) {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const animationStartTime = useRef<number | null>(null);
  const textRef = useRef<THREE.Mesh>(null);

  // アニメーション開始（遅延を大幅短縮）
  useEffect(() => {
    const timer = setTimeout(
      () => {
        setIsAnimating(true);
        animationStartTime.current = Date.now();
      },
      Math.min(delay, 100)
    ); // 最大100msに制限

    return () => clearTimeout(timer);
  }, [delay]);

  // カーソルブリンクアニメーション（アニメーション開始前）
  useEffect(() => {
    if (!isAnimating) {
      const blinkInterval = setInterval(() => {
        setShowCursor((prev) => !prev);
      }, 300); // 300msごとにブリンク（高速化）

      return () => clearInterval(blinkInterval);
    } else {
      setShowCursor(false); // アニメーション開始後はカーソルを非表示
    }
  }, [isAnimating]);

  // フレームごとのアニメーション更新
  useFrame(() => {
    if (!isAnimating || !animationStartTime.current) return;

    const elapsed = Date.now() - animationStartTime.current;
    const animationDuration = text.length * 40; // 1文字あたり40ms（高速化）
    const progress = Math.min(elapsed / animationDuration, 1);

    if (progress < 1) {
      // アニメーション中：文字化けから徐々に正しい文字に
      let newDisplayText = '';
      for (let i = 0; i < text.length; i++) {
        const charProgress = Math.max(0, progress * text.length - i);

        if (charProgress >= 1) {
          // この文字は完成
          newDisplayText += text[i];
        } else if (charProgress > 0.5) {
          // この文字はアニメーション中（後半は正しい文字の確率を高める）
          if (Math.random() < 0.8) {
            newDisplayText += text[i];
          } else {
            newDisplayText += generateRandomChar();
          }
        } else if (charProgress > 0) {
          // この文字はアニメーション中（前半は控えめに）
          if (Math.random() < 0.3) {
            newDisplayText += text[i];
          } else {
            newDisplayText += ' '; // 空白で静かに
          }
        } else {
          // この文字はまだ開始していない
          newDisplayText += ' '; // 空白で静かに
        }
      }
      setDisplayText(newDisplayText);
    } else {
      // アニメーション完了
      setDisplayText(text);
      setIsAnimating(false);
    }
  });

  // 初期状態では空白を表示（静かに）
  useEffect(() => {
    if (!isAnimating && displayText === '') {
      const emptyText = text
        .split('')
        .map(() => ' ')
        .join('');
      setDisplayText(emptyText);
    }
  }, [text, isAnimating, displayText]);

  return (
    <>
      <Text
        ref={textRef}
        position={position}
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        maxWidth={10}
        lineHeight={1.2}
      >
        {displayText}
      </Text>
      {/* アニメーション開始前のブリンクカーソル */}
      {!isAnimating && showCursor && (
        <Text
          position={[position[0] + 2, position[1], position[2]]}
          fontSize={fontSize}
          color={color}
          anchorX="left"
          anchorY="middle"
        >
          _
        </Text>
      )}
    </>
  );
}
