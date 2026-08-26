"use client";

import { useEffect, useRef, useState } from "react";
import { isWebGLAvailable } from "@/lib/webgl";

type Props = {
  src: string;
  orbit?: string;
  distance?: string;
  autoRotate?: boolean;
  animationName?: string;
};

function ModelFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-black/40 border border-white/5">
      <div className="text-center px-6">
        <i className="fas fa-microchip text-4xl text-purple-400/50 mb-3"></i>
        <p className="text-white/40 text-sm">ไม่สามารถแสดงโมเดล 3 มิติได้ในอุปกรณ์นี้</p>
      </div>
    </div>
  );
}

export default function CircuitBoard3D({ src, orbit = "45deg 35deg", distance = "1.2m", autoRotate = true, animationName }: Props) {
  const modelRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSupported(isWebGLAvailable());
  }, []);

  useEffect(() => {
    if (!supported) return;

    import("@google/model-viewer").catch(() => setFailed(true));

    const model = modelRef.current as any;
    if (!model) return;

    const onLoad = () => {
      model.classList.add("loaded");
      if (animationName) {
        model.animationName = animationName;
        model.play({ repetitions: 1 });
      }
    };
    const onError = () => setFailed(true);

    model.addEventListener("load", onLoad);
    model.addEventListener("error", onError);
    return () => {
      model.removeEventListener("load", onLoad);
      model.removeEventListener("error", onError);
    };
  }, [animationName, supported]);

  if (supported === null) {
    return <div ref={containerRef} className="relative w-full h-full" />;
  }

  if (!supported || failed) {
    return (
      <div ref={containerRef} className="relative w-full h-full">
        <ModelFallback />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* @ts-ignore */}
      <model-viewer
        ref={modelRef}
        src={src}
        touch-action="pan-y"
        camera-orbit={`${orbit} ${distance}`}
        auto-rotate={autoRotate ? "" : undefined}
        animation-name={animationName || undefined}
        min-camera-orbit="auto auto 0.3m"
        max-camera-orbit="auto auto 10m"
        interpolation-decay="200"
        exposure="3"
        shadow-intensity="1"
        environment-image="neutral"
        autoplay
        loading="eager"
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
        class="circuit-model"
      />
    </div>
  );
}
