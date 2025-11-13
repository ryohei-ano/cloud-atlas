'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ANONYMOUS_USER_ID } from '@/lib/constants';
import type { Memory } from '@/types';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  type: 'system' | 'user' | 'success' | 'error';
}


interface TerminalStreamProps {
  onClose?: () => void;
  isKeyboardOpen?: boolean;
}

export default function TerminalStream({ onClose, isKeyboardOpen = false }: TerminalStreamProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 初期メッセージ
    setMessages([
      {
        id: '1',
        text: 'Welcome to the memory terminal...',
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      },
      {
        id: '2',
        text: 'Type your memory and click 送信 to post',
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }
    ]);

    // Supabase接続テスト
    const testConnection = async () => {
      try {
        const { error } = await supabase
          .from('memories')
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          addMessage(`⚠ Supabase connection error: ${error.message}`, 'error');
        }
        // 成功時はメッセージを表示しない
      } catch (err) {
        addMessage(`⚠ Failed to connect to Supabase: ${err}`, 'error');
      }
    };

    testConnection();

    // Supabaseリアルタイム購読
    const channel = supabase
      .channel('memories')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'memories' },
        (payload) => {
          const newMemory = payload.new as Memory;
          addMessage(
            `New memory posted: "${newMemory.memory}" [ID: undefined]`,
            'system'
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addMessage = (text: string, type: Message['type'] = 'user') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      timestamp: new Date().toLocaleTimeString(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // 不適切な内容をチェックする関数
  const validateContent = (text: string): { isValid: boolean; reason?: string } => {
    const content = text.toLowerCase().trim();
    
    // 禁止単語リスト（日本語・英語）
    const prohibitedWords = [
      // 卑猥な単語
      'セックス', 'sex', 'エッチ', 'ちんこ', 'まんこ', 'おっぱい', 'ペニス', 'ヴァギナ', 'オナニー', 'masturbation',
      'porn', 'ポルノ', 'アダルト', 'adult', 'nude', 'ヌード', 'エロ', 'ero', 'hentai', 'ヘンタイ', 'フェラ', 'フェラチオ',
      'フェラチオ', 'クンニ', 'cunnilingus', 'クンニリングス', 'アナル', 'anal', 'ディープキス', 'deep kiss', 'ディープキス', 'ちんぽ', 'ちんぽこ',
      'マンコ', 'まんこ', 'おちんちん', 'おちんぽ', 'おっぱい', 'おぱい', '乳首', 'ちくび', '乳首', 'ちくび', 'バイブ', 'バイブレーター',
      'コンドーム', 'コンドーム', '避妊具', '避妊具', '避妊', '避妊', 'セクシャル',
      // 誹謗中傷・差別用語
      '死ね', 'しね', 'die', 'kill', 'キル', 'ころす', '殺す', 'アホ', 'あほ', 'stupid', 'idiot',
      'ブス', 'ぶす', 'ugly', 'デブ', 'でぶ', 'fat', 'きもい', 'キモい', 'gross', 'disgusting',
      'うざい', 'ウザい', 'annoying', 'クズ', 'くず', 
      // 差別用語
      'チョン', 'ちょん', 'ガイジ', 'がいじ', 'retard', 'nigger', 'faggot', 'bitch',
      // 暴力的な表現
      '暴力', 'violence', '殴る', 'なぐる', 'punch', 'beat', 'テロ', 'terror', 'bomb', '爆弾',
      // その他の不適切な表現
      'うんこ', 'ウンコ', 'shit', 'fuck', 'damn', 'hell', 'クソ', 'くそ', 'crap', 'うんち',
    ];

    // 禁止単語チェック
    for (const word of prohibitedWords) {
      if (content.includes(word)) {
        return { isValid: false, reason: '不適切な内容が含まれています' };
      }
    }

    // 文字数チェック
    if (content.length < 1) {
      return { isValid: false, reason: '内容を入力してください' };
    }

    if (content.length > 500) {
      return { isValid: false, reason: '500文字以内で入力してください' };
    }

    // URLスパムチェック
    const urlPattern = /(https?:\/\/[^\s]+)/gi;
    const urls = content.match(urlPattern);
    if (urls && urls.length > 2) {
      return { isValid: false, reason: 'URLは2個までです' };
    }

    return { isValid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isSubmitting) {
      return;
    }

    const memory = inputValue.trim();
    
    // 内容のバリデーション
    const validation = validateContent(memory);
    if (!validation.isValid) {
      addMessage(`✗ ${validation.reason}`, 'error');
      return;
    }
    
    setIsSubmitting(true);
    addMessage(`> ${memory}`, 'user');

    try {
      // 直接Supabaseに保存（高速化）
      const { error } = await supabase
        .from('memories')
        .insert([{ memory, memory_id: ANONYMOUS_USER_ID }]);

      if (error) {
        addMessage(`✗ Error: ${error.message}`, 'error');
      } else {
        addMessage(`✓ Posted [ID: ${ANONYMOUS_USER_ID}]`, 'success');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addMessage(`✗ Error: ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const getMessageColorWin2k = (type: Message['type']) => {
    switch (type) {
      case 'system': return '#000080'; // ダークブルー
      case 'user': return '#000000'; // ブラック
      case 'success': return '#008000'; // ダークグリーン
      case 'error': return '#800000'; // ダークレッド
      default: return '#000000';
    }
  };

  return (
    <div 
      className={`w-full font-mono flex flex-col ${isKeyboardOpen ? 'h-auto' : 'h-48 sm:h-64'}`}
      style={{
        background: '#c0c0c0',
        border: '2px outset #c0c0c0',
        borderRadius: '0',
        boxShadow: 'inset -1px -1px #808080, inset 1px 1px #dfdfdf, inset -2px -2px #808080, inset 2px 2px #dfdfdf',
        minHeight: isKeyboardOpen ? '200px' : undefined,
        maxHeight: isKeyboardOpen ? '50vh' : undefined
      }}
    >
      {/* タイトルバー */}
      <div 
        className="flex items-center justify-between px-2 py-1 text-xs sm:text-sm"
        style={{
          background: 'linear-gradient(90deg, #0a246a 0%, #a6caf0 100%)',
          color: 'white',
          borderBottom: '1px solid #808080'
        }}
      >
        <span className="font-bold">青春はバグだ。｜ ポカリスエット</span>
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-gray-400" style={{ border: '1px outset #c0c0c0' }}></div>
          <div className="w-3 h-3 bg-gray-400" style={{ border: '1px outset #c0c0c0' }}></div>
          <button
            onClick={onClose}
            className="bg-gray-400 cursor-pointer flex items-center justify-center text-black font-bold hover:bg-gray-500"
            style={{ 
              border: '1px outset #c0c0c0',
              fontSize: '8px',
              lineHeight: '1',
              width: '10.5px',
              height: '10.5px',
              minWidth: '10.5px',
              minHeight: '10.5px'
            }}
          >
            ×
          </button>
        </div>
      </div>
      
      {/* メッセージ表示エリア */}
      <div 
        className="flex-1 overflow-y-auto space-y-1 p-2"
        style={{
          background: 'white',
          border: '1px inset #c0c0c0',
          margin: '2px'
        }}
      >
        {messages.map((message) => (
          <div key={message.id} className={`text-xs sm:text-sm break-words`} style={{ color: getMessageColorWin2k(message.type) }}>
            <span style={{ color: '#808080' }}>[{message.timestamp}]</span> {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 入力エリア */}
      <div 
        className="p-2"
        style={{
          background: '#c0c0c0',
          borderTop: '1px solid #808080'
        }}
      >
        <div className="flex items-center space-x-2">
          <span className="text-xs sm:text-sm" style={{ color: '#000000' }}>$</span>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter your memory..."
            disabled={isSubmitting}
            className="flex-1 px-2 py-1 text-xs sm:text-sm resize-none"
            style={{
              fontSize: '16px', // iOS Safari ズーム防止
              WebkitAppearance: 'none',
              borderRadius: 0,
              background: 'white',
              border: '1px inset #c0c0c0',
              color: '#000000',
              outline: 'none',
              height: '32px', // 入力フィールドと同じ高さ
              minHeight: '32px',
              maxHeight: '80px'
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onFocus={(e) => {
              // スマホでキーボードが開いた時の処理
              if (isKeyboardOpen && typeof window !== 'undefined' && window.innerWidth <= 640) {
                // スクロール防止
                e.preventDefault();
                // ターミナルを画面下部に固定
                setTimeout(() => {
                  const terminalElement = e.target.closest('.terminal-fixed');
                  if (terminalElement) {
                    terminalElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
                  }
                }, 100);
              } else {
                // デスクトップやキーボードが開いていない場合の通常処理
                setTimeout(() => {
                  if (e.target) {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }
                }, 100);
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !inputValue.trim()}
            className="px-3 py-1 text-xs sm:text-sm cursor-pointer"
            style={{
              background: '#c0c0c0',
              border: '2px outset #c0c0c0',
              color: '#000000',
              borderRadius: 0,
              height: '32px',
              minWidth: '60px'
            }}
            onMouseDown={(e) => {
              if (!isSubmitting && inputValue.trim()) {
                e.currentTarget.style.border = '2px inset #c0c0c0';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.border = '2px outset #c0c0c0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '2px outset #c0c0c0';
            }}
          >
            {isSubmitting ? '送信中...' : '送信'}
          </button>
        </div>
      </div>
    </div>
  );
}
