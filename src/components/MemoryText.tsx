'use client';

import TypingAnimation from './TypingAnimation';
import type { Memory, Theme } from '@/types';

interface MemoryTextProps {
  memory: Memory;
  position: [number, number, number];
  delay: number;
  scale?: number;
  isLatest?: boolean;
  theme?: Theme;
}

export default function MemoryText({
  memory,
  position,
  delay,
  scale = 1,
  isLatest = false,
  theme,
}: MemoryTextProps) {
  // 作成日時を指定されたフォーマットに変更
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hour}:${minute}`;
  };

  // 指定されたフォーマットでテキストを作成（memory_idを"undefined"に統一）
  const displayText = `> undefined がログインしました\n> "${memory.memory}"\n\n[${formatDate(memory.created_at)}]`;

  // テーマに応じた色を決定
  const getTextColor = () => {
    if (isLatest) return '#00ff00'; // 最新の投稿は常に緑色
    if (theme) return theme.textColor;
    return '#ffffff'; // デフォルトは白
  };

  return (
    <TypingAnimation
      text={displayText}
      position={position}
      delay={delay}
      fontSize={0.3 * scale}
      color={getTextColor()}
    />
  );
}
