"use client";

import dynamic from "next/dynamic";

const CircuitBoard3D = dynamic(() => import("@/components/CircuitBoard3D"), { ssr: false });

export default function Laptop3D() {
  return (
    <div className="w-full h-full">
      <CircuitBoard3D
        src="/classic_laptop.glb"
        orbit="-30deg 75deg"
        distance="1.5m"
        autoRotate={false}
      />
    </div>
  );
}
