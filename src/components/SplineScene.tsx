"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false });

export default function SplineScene({ onLoad }: { onLoad?: () => void }) {
  const called = useRef(false);

  const handleLoad = useCallback(() => {
    if (!called.current) {
      called.current = true;
      onLoad?.();
    }
  }, [onLoad]);

  return (
    <div className="absolute inset-0 z-0">
      <Spline
        scene="/ai_data_model_interaction.spline"
        onLoad={handleLoad}
      />
    </div>
  );
}
