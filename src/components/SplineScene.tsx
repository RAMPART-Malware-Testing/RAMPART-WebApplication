"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";
import { isWebGLAvailable } from "@/lib/webgl";

const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false });

const LOAD_TIMEOUT_MS = 15000;

function SplineFallback() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#0b0b1a] via-[#120c26] to-[#050510]">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.35),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(99,102,241,0.25),transparent_60%)]" />
    </div>
  );
}

export default function SplineScene({ onLoad }: { onLoad?: () => void }) {
  const called = useRef(false);
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);

  const finish = useCallback(() => {
    if (!called.current) {
      called.current = true;
      onLoad?.();
    }
  }, [onLoad]);

  useEffect(() => {
    setWebglOk(isWebGLAvailable());
  }, []);

  useEffect(() => {
    if (webglOk === false) {
      setFailed(true);
      finish();
    }
  }, [webglOk, finish]);

  useEffect(() => {
    if (webglOk !== true) return;
    const timer = setTimeout(() => {
      if (!called.current) {
        setFailed(true);
        finish();
      }
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [webglOk, finish]);

  if (webglOk === null) {
    return <div className="absolute inset-0 z-0" />;
  }

  if (failed || webglOk === false) {
    return (
      <div className="absolute inset-0 z-0">
        <SplineFallback />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0">
      <ErrorBoundary
        fallback={<SplineFallback />}
        onError={() => {
          setFailed(true);
          finish();
        }}
      >
        <Spline
          scene="/ai_data_model_interaction.spline"
          onLoad={finish}
        />
      </ErrorBoundary>
    </div>
  );
}
