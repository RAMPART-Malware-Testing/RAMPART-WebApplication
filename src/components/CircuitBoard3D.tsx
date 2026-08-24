"use client";

import { useEffect, useRef } from "react";
import "@google/model-viewer";

type Props = {
  src: string;
  orbit?: string;
  distance?: string;
  autoRotate?: boolean;
  animationName?: string;
};

export default function CircuitBoard3D({ src, orbit = "45deg 35deg", distance = "1.2m", autoRotate = true, animationName }: Props) {
  const modelRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const model = modelRef.current as any;
    if (!model) return;

    const onLoad = () => {
      model.classList.add("loaded");
      if (animationName) {
        model.animationName = animationName;
        model.play({ repetitions: 1 });
      }
    };

    model.addEventListener("load", onLoad);
    return () => model.removeEventListener("load", onLoad);
  }, [animationName]);

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
