"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getRenderTier, type RenderTier } from "@/lib/webgl";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<{ stop: () => void; play: () => void } | null>(null);
  const called = useRef(false);
  const [tier, setTier] = useState<RenderTier | null>(null);
  const [inView, setInView] = useState(false);
  const [failed, setFailed] = useState(false);

  const finish = useCallback(() => {
    if (!called.current) {
      called.current = true;
      onLoad?.();
    }
  }, [onLoad]);

  useEffect(() => {
    setTier(getRenderTier());
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      const app = appRef.current;
      if (!app) return;
      if (document.visibilityState === "hidden") app.stop();
      else app.play();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (tier === null || tier === "off" || !inView) return;
    const timer = setTimeout(() => {
      if (!called.current) {
        setFailed(true);
        finish();
      }
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [tier, inView, finish]);

  if (tier === "off" || failed) {
    return (
      <div className="absolute inset-0 z-0">
        <SplineFallback />
      </div>
    );
  }

  if (tier === null || !inView) {
    return <div ref={containerRef} className="absolute inset-0 z-0" />;
  }

  return (
    <div ref={containerRef} className="absolute inset-0 z-0">
      <ErrorBoundary
        fallback={<SplineFallback />}
        onError={() => {
          setFailed(true);
          finish();
        }}
      >
        <Spline
          scene="/ai_data_model_interaction.spline"
          renderOnDemand={tier === "lite"}
          onLoad={(app) => {
            appRef.current = app;
            if (document.visibilityState === "hidden") app.stop();
            finish();
          }}
        />
      </ErrorBoundary>
    </div>
  );
}