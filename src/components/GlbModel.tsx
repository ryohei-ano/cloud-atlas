'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { GlbModelProps } from '@/types';
import { devLog } from '@/lib/devLogger';

// グローバルにモデルごとの元の色を保存（全インスタンスで共有）
const originalColorsCache = new Map<string, Array<{ r: number; g: number; b: number }>>();

export default function GlbModel({
  modelSrc,
  position,
  delay,
  scale = 1.3,
  rotation = [0, 0, 0],
  brightness = 3.0,
}: GlbModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isVisible, setIsVisible] = useState(false);

  // ランダムな初期回転角度を生成（X, Y, Z軸全てランダム）
  const randomInitialRotation = useMemo(() => [
    (Math.random() - 0.5) * Math.PI * 0.5, // X軸: -45度〜+45度の範囲で傾ける
    Math.random() * Math.PI * 2, // Y軸: 0〜360度
    (Math.random() - 0.5) * Math.PI * 0.5, // Z軸: -45度〜+45度の範囲で傾ける
  ] as [number, number, number], []);

  // GLBモデルを読み込み
  const { scene } = useGLTF(modelSrc);

  // グローバルキャッシュから元の色を取得、なければ保存
  if (!originalColorsCache.has(modelSrc)) {
    const colors: Array<{ r: number; g: number; b: number }> = [];
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            if ('color' in mat && mat.color instanceof THREE.Color) {
              // 元の色を数値として保存（オブジェクトではなくプリミティブ値）
              colors.push({
                r: mat.color.r,
                g: mat.color.g,
                b: mat.color.b,
              });
            }
          });
        }
      }
    });
    originalColorsCache.set(modelSrc, colors);
    devLog.log('Original colors saved for', modelSrc, ':', colors);
  }

  // シーンのクローンを作成し、明るさを調整
  const clonedScene = useMemo(() => {
    const originalColors = originalColorsCache.get(modelSrc);
    if (!originalColors) return scene.clone(true);

    // シーンをクローン
    const clone = scene.clone(true);

    // クローンしたシーンのマテリアルを明示的にクローンして明るさを適用
    let colorIndex = 0;
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            // 配列の場合：各マテリアルをクローンして明るさを適用
            mesh.material = mesh.material.map((mat) => {
              const clonedMat = mat.clone();
              if ('color' in clonedMat && clonedMat.color instanceof THREE.Color && originalColors[colorIndex]) {
                // 元の色から明るさを計算（累積を防ぐ）
                const orig = originalColors[colorIndex];
                clonedMat.color.setRGB(
                  orig.r * brightness,
                  orig.g * brightness,
                  orig.b * brightness
                );
              }
              colorIndex++;
              return clonedMat;
            });
          } else {
            // 単一マテリアルの場合
            const clonedMat = mesh.material.clone();
            if ('color' in clonedMat && clonedMat.color instanceof THREE.Color && originalColors[colorIndex]) {
              // 元の色から明るさを計算（累積を防ぐ）
              const orig = originalColors[colorIndex];
              clonedMat.color.setRGB(
                orig.r * brightness,
                orig.g * brightness,
                orig.b * brightness
              );
            }
            mesh.material = clonedMat;
            colorIndex++;
          }
        }
      }
    });

    return clone;
  }, [scene, brightness, modelSrc]);

  useEffect(() => {
    devLog.log('GLB model loading:', modelSrc);

    if (clonedScene) {
      devLog.log('GLB model loaded successfully:', modelSrc);
    }

    // 遅延後に表示開始
    const timer = setTimeout(() => {
      setIsVisible(true);
      devLog.log('GLB model visible:', modelSrc);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [modelSrc, delay, clonedScene]);

  // アニメーション（フェードイン + 回転）
  useFrame((state) => {
    if (groupRef.current && isVisible) {
      const elapsed = state.clock.getElapsedTime() * 1000 - delay;

      if (elapsed > 0) {
        // フェードイン（スケールで表現）
        const fadeProgress = Math.min(elapsed / 1000, 1); // 1秒でフェードイン
        const targetScale = scale * fadeProgress;
        groupRef.current.scale.set(targetScale, targetScale, targetScale);

        // 回転アニメーション（Y軸中心にゆっくり回転）
        groupRef.current.rotation.y += 0.003; // 回転速度
      }
    }
  });

  if (!isVisible) {
    return null;
  }

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={randomInitialRotation}
      scale={0} // 初期スケールを0に設定（useFrameで更新）
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// モデルを事前読み込み
useGLTF.preload('/objects/01.glb');
useGLTF.preload('/objects/02.glb');
useGLTF.preload('/objects/03.glb');
