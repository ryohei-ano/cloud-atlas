'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { devLog } from '@/lib/devLogger';

interface VideoPlaneProps {
  videoSrc: string;
  position: [number, number, number];
  delay: number;
  scale?: number;
}

export default function VideoPlane({ videoSrc, position, delay, scale = 1 }: VideoPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9); // デフォルトは16:9

  useEffect(() => {
    // 動画要素を事前に作成して読み込み開始
    const video = document.createElement('video');
    video.src = videoSrc;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto'; // より積極的な事前読み込み
    video.defaultMuted = true; // デフォルトでミュート

    // モバイル対応の設定を強化
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('muted', 'true');
    video.setAttribute('autoplay', 'false');
    video.setAttribute('controls', 'false');
    video.setAttribute('disablepictureinpicture', 'true');

    // iOS Safari対応
    video.style.objectFit = 'cover';
    video.style.width = '100%';
    video.style.height = '100%';

    let textureCreated = false;
    let playAttempted = false;

    // エラーハンドリング
    const handleError = (error: Event) => {
      devLog.error('Video loading error for', videoSrc, ':', error);
    };

    // 動画が読み込まれたらテクスチャを作成
    const handleLoadedData = () => {
      if (textureCreated) return;

      try {
        // 動画が実際に再生可能な状態になってからテクスチャを作成
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          const texture = new THREE.VideoTexture(video);
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.format = THREE.RGBAFormat;
          texture.flipY = true; // モバイルでの上下反転を修正
          texture.generateMipmaps = false;
          texture.needsUpdate = true;
          setVideoTexture(texture);
          setIsLoaded(true);
          textureCreated = true;

          // 動画の実際のアスペクト比を計算して保存
          const ratio = video.videoWidth / video.videoHeight;
          setAspectRatio(ratio);

          devLog.log(
            'Video texture created for:',
            videoSrc,
            'Size:',
            video.videoWidth,
            'x',
            video.videoHeight,
            'Aspect ratio:',
            ratio.toFixed(2)
          );
        } else {
          devLog.log('Video not ready yet, waiting...', videoSrc);
        }
      } catch (error) {
        devLog.error('Video texture creation failed:', error);
      }
    };

    // より積極的な再生試行
    const tryPlay = async () => {
      if (playAttempted) return;
      playAttempted = true;

      try {
        // 動画の準備状態を確認
        if (video.readyState >= 2) {
          video.currentTime = 0;
          const playPromise = video.play();

          if (playPromise !== undefined) {
            await playPromise;
            devLog.log('Video playing successfully:', videoSrc);

            // 再生開始後にテクスチャを作成（黒い画面を避ける）
            if (!textureCreated && video.videoWidth > 0 && video.videoHeight > 0) {
              handleLoadedData();
            }
          }
        }
      } catch (error) {
        devLog.warn('Video autoplay failed for', videoSrc, ':', error);
        playAttempted = false; // 再試行を許可
      }
    };

    const handleCanPlay = () => {
      devLog.log('Video can play:', videoSrc);
      // 少し遅延してから再生を試行（黒い画面を避ける）
      setTimeout(() => {
        tryPlay();
      }, 100);
    };

    const handleLoadedMetadata = () => {
      devLog.log('Video metadata loaded:', videoSrc);
      // メタデータ読み込み後は即座に試行
      tryPlay();
    };

    // 動画が実際に再生開始されたときのハンドラー
    const handlePlaying = () => {
      devLog.log('Video actually playing:', videoSrc);
      // 再生開始後にテクスチャを作成
      if (!textureCreated && video.videoWidth > 0 && video.videoHeight > 0) {
        setTimeout(() => {
          handleLoadedData();
        }, 50); // 少し遅延してテクスチャ作成
      }
    };

    // グローバルなユーザーインタラクションハンドラー
    const handleUserInteraction = async () => {
      try {
        if (video.paused) {
          await video.play();
          devLog.log('Video started after user interaction:', videoSrc);
        }
      } catch (error) {
        devLog.warn('Video play after interaction failed:', error);
      }
    };

    // イベントリスナーを追加
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', tryPlay);
    video.addEventListener('playing', handlePlaying); // 実際の再生開始時
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', () => devLog.log('Video load started:', videoSrc));

    // グローバルなユーザーインタラクションリスナー
    const interactionEvents = ['touchstart', 'touchend', 'click', 'keydown'];
    interactionEvents.forEach((eventType) => {
      document.addEventListener(eventType, handleUserInteraction, {
        once: false,
        passive: true,
      });
    });

    // ThreeMemorySceneからのカスタムイベントもリッスン
    const handleGlobalInteraction = () => {
      handleUserInteraction();
    };

    window.addEventListener('userInteractionDetected', handleGlobalInteraction);

    videoRef.current = video;

    // 遅延後に表示開始
    const timer = setTimeout(() => {
      setIsVisible(true);
      // 表示開始時にも再生を試行
      if (video.readyState >= 2) {
        tryPlay();
      }
    }, delay);

    return () => {
      clearTimeout(timer);

      // イベントリスナーを削除
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', tryPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);

      interactionEvents.forEach((eventType) => {
        document.removeEventListener(eventType, handleUserInteraction);
      });

      window.removeEventListener('userInteractionDetected', handleGlobalInteraction);

      // 動画リソースをクリーンアップ
      video.pause();
      video.src = '';
      video.load();
    };
  }, [videoSrc, delay]);

  // videoTextureのクリーンアップを別のuseEffectで管理
  useEffect(() => {
    return () => {
      if (videoTexture) {
        videoTexture.dispose();
      }
    };
  }, [videoTexture]);

  // アニメーション（フェードイン効果）
  useFrame((state) => {
    if (meshRef.current && isVisible && isLoaded) {
      const elapsed = state.clock.getElapsedTime() * 1000 - delay;
      if (elapsed > 0) {
        const opacity = Math.min(elapsed / 500, 1); // 0.5秒でフェードイン（高速化）
        if (meshRef.current.material instanceof THREE.MeshBasicMaterial) {
          meshRef.current.material.opacity = opacity;
          // 動画をより鮮明に表示するための設定
          meshRef.current.material.transparent = opacity < 1;
        }
      }
    }
  });

  if (!isVisible || !videoTexture || !isLoaded) {
    return null;
  }

  // 16:9のアスペクト比に固定
  const targetAspectRatio = 16 / 9;
  const baseHeight = 3 * scale; // 基準の高さ
  const width = baseHeight * targetAspectRatio; // 16:9の幅
  const height = baseHeight;

  // coverのようにクロップするためのUVマッピング調整
  let uvScaleX = 1;
  let uvScaleY = 1;
  let uvOffsetX = 0;
  let uvOffsetY = 0;

  if (aspectRatio > targetAspectRatio) {
    // 動画が横長の場合：上下をフルに使い、左右をクロップ
    uvScaleX = targetAspectRatio / aspectRatio;
    uvOffsetX = (1 - uvScaleX) / 2;
  } else {
    // 動画が縦長の場合：左右をフルに使い、上下をクロップ
    uvScaleY = aspectRatio / targetAspectRatio;
    uvOffsetY = (1 - uvScaleY) / 2;
  }

  // テクスチャのUVマッピングを調整
  if (videoTexture) {
    videoTexture.repeat.set(uvScaleX, uvScaleY);
    videoTexture.offset.set(uvOffsetX, uvOffsetY);
    videoTexture.needsUpdate = true;
  }

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={videoTexture}
        transparent
        opacity={0}
        side={THREE.FrontSide} // 正面のみ描画
      />
    </mesh>
  );
}
