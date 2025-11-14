'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Text } from '@react-three/drei';
import { supabase } from '@/lib/supabase';
import MemoryText from './MemoryText';
import VideoPlane from './VideoPlane';
import GlbModel from './GlbModel';
import { THEMES } from '@/lib/constants';
import type { Memory, Theme } from '@/types';
import { devLog } from '@/lib/devLogger';

// 大量のテキストが重ならないように3D座標を生成する関数
const generateRandomPosition = (index: number): [number, number, number] => {
  // 複数の層に分けて配置
  const itemsPerLayer = 10; // 各層に10個
  const currentLayer = Math.floor(index / itemsPerLayer);
  const indexInLayer = index % itemsPerLayer;

  // 各層の基本半径（カメラから見えやすいように調整）
  const baseRadius = 8 + currentLayer * 6; // 8, 14, 20, 26, 32...

  // フィボナッチ螺旋を使用して均等分布
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 黄金角
  const theta = indexInLayer * goldenAngle;
  const phi = Math.acos(1 - (2 * (indexInLayer + 0.5)) / itemsPerLayer);

  // 球面座標から直交座標への変換
  const x = baseRadius * Math.sin(phi) * Math.cos(theta);
  const y = baseRadius * Math.cos(phi);
  const z = baseRadius * Math.sin(phi) * Math.sin(theta);

  // Y座標を調整（カメラの初期位置[0,0,30]から見て被らないように）
  const adjustedY = y * 0.3 + (Math.random() - 0.5) * 4; // Y座標をさらに圧縮

  // Z座標を調整（カメラの前方により多く配置）
  const adjustedZ = z * 0.7 + (Math.random() - 0.5) * 8; // Z軸方向の範囲を狭める

  // 追加のランダム性（重複を避けるため）
  const randomOffset = 1.0;
  const offsetX = (Math.random() - 0.5) * randomOffset;
  const offsetY = (Math.random() - 0.5) * randomOffset;
  const offsetZ = (Math.random() - 0.5) * randomOffset;

  return [x + offsetX, adjustedY + offsetY, adjustedZ + offsetZ];
};

// ローディング表示コンポーネント
function LoadingText({ progress, theme }: { progress: number; theme: Theme }) {
  // プログレスに基づいてバーの幅を計算
  const barWidth = (progress / 100) * 3.6; // 最大3.6の幅
  const barPosition = -1.8 + barWidth / 2; // 左端から開始

  return (
    <group position={[0, 0, 0]}>
      {/* Loading text */}
      <Text
        position={[0, 1, 0]}
        fontSize={0.5}
        color={theme.textColor}
        anchorX="center"
        anchorY="middle"
      >
        Loading...
      </Text>

      {/* Loading bar background (outer border) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4, 0.4, 0.1]} />
        <meshBasicMaterial color={theme.textColor} />
      </mesh>

      {/* Loading bar background (inner) - transparent */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[3.8, 0.3, 0.1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Loading bar fill - animated */}
      {barWidth > 0 && (
        <mesh position={[barPosition, 0, 0.1]}>
          <boxGeometry args={[barWidth, 0.2, 0.1]} />
          <meshBasicMaterial color={theme.textColor} />
        </mesh>
      )}

      {/* Progress segments (8-bit style) */}
      {Array.from({ length: 10 }, (_, i) => {
        const segmentProgress = (progress - i * 10) / 10;
        const segmentOpacity = Math.max(0, Math.min(1, segmentProgress));
        const segmentX = -1.6 + i * 0.36;

        return segmentOpacity > 0 ? (
          <mesh key={i} position={[segmentX, 0, 0.15]}>
            <boxGeometry args={[0.3, 0.15, 0.05]} />
            <meshBasicMaterial color={theme.textColor} transparent opacity={segmentOpacity} />
          </mesh>
        ) : null;
      })}
    </group>
  );
}

// 動画専用の配置関数（さらに散らばった配置、固定位置）
const generateVideoPosition = (index: number): [number, number, number] => {
  // シード値を使って固定位置を生成（再読込時も同じ位置）
  const seed = index * 12345;
  const random1 = Math.sin(seed) * 10000;
  const random2 = Math.sin(seed * 1.1) * 10000;
  const random3 = Math.sin(seed * 1.2) * 10000;
  const seededRandom1 = random1 - Math.floor(random1);
  const seededRandom2 = random2 - Math.floor(random2);
  const seededRandom3 = random3 - Math.floor(random3);

  // より散らばった配置
  const itemsPerLayer = 4; // 各層に4個（さらに散らばらせる）
  const currentLayer = Math.floor(index / itemsPerLayer);
  const indexInLayer = index % itemsPerLayer;

  // さらに広い範囲に配置
  const baseRadius = 4 + currentLayer * 6; // 4, 10, 16, 22...

  // フィボナッチ螺旋を使用して均等分布
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 黄金角
  const theta = indexInLayer * goldenAngle;
  const phi = Math.acos(1 - (2 * (indexInLayer + 0.5)) / itemsPerLayer);

  // 球面座標から直交座標への変換
  const x = baseRadius * Math.sin(phi) * Math.cos(theta);
  const y = baseRadius * Math.cos(phi);
  const z = baseRadius * Math.sin(phi) * Math.sin(theta);

  // Y座標を調整（さらに縦方向に散らばらせる）
  const adjustedY = y * 0.6 + (seededRandom1 - 0.5) * 6;

  // Z座標を調整（前後にさらに散らばらせる）
  const adjustedZ = z * 1.0 + (seededRandom2 - 0.5) * 8;

  // 追加のランダム性を増加（固定シード使用）
  const randomOffset = 2.0;
  const offsetX = (seededRandom3 - 0.5) * randomOffset;
  const offsetY = (seededRandom1 - 0.5) * randomOffset;
  const offsetZ = (seededRandom2 - 0.5) * randomOffset;

  return [x + offsetX, adjustedY + offsetY, adjustedZ + offsetZ];
};

// 動画ファイルのリスト
const videoFiles = [
  '/video/01.mp4',
  '/video/02.mp4',
  '/video/03.mp4',
  '/video/04.mp4',
  '/video/05.mp4',
  '/video/06.mp4',
  '/video/07.mp4',
  '/video/08.mp4',
  '/video/09.mp4',
  '/video/10.mp4',
  '/video/11.mp4',
  '/video/12.mp4',
];

const glbFiles = [
  '/objects/01.glb',
  '/objects/02.glb',
  '/objects/03.glb',
];

// シーンの内容
function SceneContent({ currentTheme }: { currentTheme: Theme }) {
  const [allMemories, setAllMemories] = useState<Memory[]>([]);
  const [displayedMemories, setDisplayedMemories] = useState<Memory[]>([]);
  const [recentMemories, setRecentMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 15秒以内かどうかを判定する関数
  const isWithinFifteenSeconds = (createdAt: string) => {
    const now = new Date();
    const postTime = new Date(createdAt);
    const diffInSeconds = (now.getTime() - postTime.getTime()) / 1000;
    return diffInSeconds <= 15;
  };

  // 最新投稿用の特別な位置を生成（重ならないように円形配置）
  const generateLatestPosition = (index: number, total: number): [number, number, number] => {
    const radius = 8;
    const angle = (index * Math.PI * 2) / Math.max(total, 1);
    return [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.5, 10 + index * 2];
  };

  // ランダムにメモリを選択する関数（表示件数を適度に調整）
  const selectRandomMemories = (memories: Memory[], count: number = 50) => {
    if (memories.length === 0) return [];

    // 表示数を50件に調整
    const result: Memory[] = [];
    for (let i = 0; i < Math.min(count, memories.length * 2); i++) {
      const randomIndex = Math.floor(Math.random() * memories.length);
      result.push(memories[randomIndex]);
    }
    return result;
  };

  // ローディングプログレスを管理
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10; // 10%ずつ増加（約0.5秒で完了）
      });
    }, 50); // 50ms間隔

    return () => clearInterval(progressInterval);
  }, []);

  // メモリデータを取得
  useEffect(() => {
    let isMounted = true;

    const fetchMemories = async () => {
      try {
        const response = await fetch('/api/get-memories');
        if (!response.ok) {
          throw new Error('Failed to fetch memories');
        }
        const data = await response.json();

        if (isMounted) {
          setAllMemories(data);

          // ランダムに選択したメモリを表示
          const randomMemories = selectRandomMemories(data);
          setDisplayedMemories(randomMemories);

          // アニメーションを再開始するためにキーを更新
          setRefreshKey((prev) => prev + 1);
        }
      } catch (err) {
        devLog.error('API error:', err);
        if (isMounted) {
          setError('Failed to load memories');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // ローディングプログレスが100%になったら実際のデータを取得
    if (loadingProgress >= 100) {
      setTimeout(() => {
        fetchMemories();
      }, 300);
    }

    return () => {
      isMounted = false;
    };
  }, [loadingProgress]);

  // Supabaseリアルタイム購読を別のuseEffectに分離
  useEffect(() => {
    // Supabaseリアルタイム購読
    const channel = supabase
      .channel('memories-3d')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'memories' },
        (payload) => {
          devLog.log('New memory received in 3D scene:', payload.new);
          // 新しいメモリを全メモリリストに追加
          const newMemory = payload.new as Memory;

          // 新しいメモリを最新メモリリストに追加
          setRecentMemories((prev) => [...prev, newMemory]);

          setAllMemories((prev) => {
            const updated = [...prev, newMemory];
            // 新しいランダム選択を実行（最新メモリ以外）- 件数を50に調整
            const randomMemories = selectRandomMemories(updated, 50);
            setDisplayedMemories(randomMemories);
            setRefreshKey((prev) => prev + 1);
            return updated;
          });

          // 15秒後に最新メモリを通常の位置に移動
          setTimeout(() => {
            setRecentMemories((prev) => prev.filter((memory) => memory.id !== newMemory.id));
            setRefreshKey((prev) => prev + 1);
          }, 15000); // 15秒 = 15000ms
        }
      )
      .subscribe();

    // クリーンアップ
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // 空の依存関係配列

  // 15秒ごとのランダム表示を別のuseEffectに分離
  useEffect(() => {
    const interval = setInterval(() => {
      if (allMemories.length > 0) {
        const randomMemories = selectRandomMemories(allMemories);
        setDisplayedMemories(randomMemories);
        setRefreshKey((prev) => prev + 1);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [allMemories]); // allMemoriesが変更された時のみ実行

  // 15秒経過した最新投稿を自動的にクリーンアップ
  useEffect(() => {
    const interval = setInterval(() => {
      setRecentMemories((prev) => {
        const filtered = prev.filter((memory) => isWithinFifteenSeconds(memory.created_at));
        if (filtered.length !== prev.length) {
          setRefreshKey((prev) => prev + 1);
        }
        return filtered;
      });
    }, 5000); // 5秒ごとにチェック

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return <LoadingText progress={loadingProgress} theme={currentTheme} />;
  }

  if (error) {
    return (
      <Text position={[0, 0, 0]} fontSize={0.8} color="#ff4444" anchorX="center" anchorY="middle">
        Error: {error}
      </Text>
    );
  }

  if (displayedMemories.length === 0) {
    return (
      <Text position={[0, 0, 0]} fontSize={0.8} color="#888888" anchorX="center" anchorY="middle">
        No memories found
      </Text>
    );
  }

  return (
    <>
      {/* 環境光 */}
      <ambientLight intensity={0.3} />

      {/* ポイントライト */}
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* 星空背景（白背景時は非表示） */}
      {currentTheme.backgroundColor !== '#ffffff' && (
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      )}

      {/* 最新のメモリをカメラに一番近い位置に表示 */}
      {recentMemories.map((memory, index) => (
        <MemoryText
          key={`recent-${memory.id}-${refreshKey}`}
          memory={memory}
          position={generateLatestPosition(index, recentMemories.length)}
          delay={0}
          scale={2.0} // より大きく表示
          isLatest={true} // 最新の投稿として緑色で表示
          theme={currentTheme}
        />
      ))}

      {/* メモリテキストを3D空間に配置 */}
      {displayedMemories.map((memory: Memory, index: number) => (
        <MemoryText
          key={`${memory.id}-${index}-${refreshKey}`} // idとindexを使って識別
          memory={memory}
          position={generateRandomPosition(index)}
          delay={index * 50} // 50msずつずらしてアニメーション開始（高速化）
          theme={currentTheme}
        />
      ))}

      {/* 動画を3D空間にランダム配置（12個全て表示） */}
      {videoFiles.map((videoSrc, index) => (
        <VideoPlane
          key={`video-${index}`}
          videoSrc={videoSrc}
          position={generateVideoPosition(index)}
          delay={index * 300} // 0.3秒ずつ段階的に表示
          scale={0.8} // サイズを小さくしてパフォーマンス向上
        />
      ))}

      {/* GLBモデルを3D空間にランダム配置 */}
      {glbFiles.map((modelSrc, index) => (
        <GlbModel
          key={`glb-${index}`}
          modelSrc={modelSrc}
          position={generateVideoPosition(videoFiles.length + index)}
          delay={index * 500} // 0.5秒ずつ段階的に表示
          scale={1.0} // 統一サイズ
          brightness={8.0} // 明るさを3.0倍に調整
        />
      ))}

      {/* カメラコントロール */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        zoomSpeed={0.6}
        panSpeed={0.8}
        rotateSpeed={0.4}
        minDistance={5}
        maxDistance={100}
      />
    </>
  );
}

export default function ThreeMemoryScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

  // 現在のテーマを取得
  const currentTheme = THEMES[currentThemeIndex];

  // ローカルストレージからテーマを復元
  useEffect(() => {
    const savedThemeIndex = localStorage.getItem('themeIndex');
    if (savedThemeIndex) {
      const index = parseInt(savedThemeIndex, 10);
      if (index >= 0 && index < THEMES.length) {
        setCurrentThemeIndex(index);
      }
    }

    // テーマ変更イベントを監視（space/page.tsxからの変更を受信）
    const handleThemeChange = (e: CustomEvent) => {
      const newThemeIndex = e.detail.themeIndex;
      if (newThemeIndex >= 0 && newThemeIndex < THEMES.length) {
        setCurrentThemeIndex(newThemeIndex);
      }
    };

    window.addEventListener('themeChanged', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
    };
  }, []);

  // モバイル動画再生のためのユーザーインタラクションハンドラー
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true);
        // すべての動画要素を取得して再生を試行
        const videos = document.querySelectorAll('video');
        videos.forEach(async (video) => {
          try {
            if (video.paused) {
              await video.play();
              devLog.log('Video started after user interaction');
            }
          } catch (error) {
            devLog.warn('Video play after interaction failed:', error);
          }
        });

        // カスタムイベントを発火して VideoPlane コンポーネントに通知
        const event = new CustomEvent('userInteractionDetected');
        window.dispatchEvent(event);
      }
    };

    // 様々なユーザーインタラクションイベントをリッスン
    const interactionEvents = ['touchstart', 'touchend', 'click', 'keydown', 'mousedown'];

    interactionEvents.forEach((eventType) => {
      document.addEventListener(eventType, handleUserInteraction, {
        once: false,
        passive: true,
      });
    });

    return () => {
      interactionEvents.forEach((eventType) => {
        document.removeEventListener(eventType, handleUserInteraction);
      });
    };
  }, [userInteracted]);

  return (
    <div className="w-full h-screen" style={{ backgroundColor: currentTheme.backgroundColor }}>
      <Canvas
        ref={canvasRef}
        camera={{
          position: [0, 0, 20],
          fov: 75,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        }}
      >
        <Suspense fallback={<LoadingText progress={0} theme={currentTheme} />}>
          <SceneContent currentTheme={currentTheme} />
        </Suspense>
      </Canvas>

      {/* 操作説明 */}
      <div
        className="fixed bottom-2 right-2 text-xs pointer-events-none"
        style={{ color: currentTheme.textColor }}
      >
        <p className="hidden sm:block">
          ドラッグ: 回転 | ホイール: ズーム | 右クリック + ドラッグ: パン
        </p>
        <p className="sm:hidden">タッチ: 回転 | ピンチ: ズーム | 2本指ドラッグ: パン</p>
      </div>
    </div>
  );
}
