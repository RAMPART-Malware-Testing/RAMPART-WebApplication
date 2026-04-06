"use client";

import React, { useEffect, useState } from "react";

interface GeometricLoaderProps {
  /** ฟังก์ชันที่เรียกเมื่อโหลดเสร็จ */
  onLoadingComplete?: () => void;
  /** ระยะเวลาโหลด (มิลลิวินาที) */
  duration?: number;
  /** ควบคุมการแสดงผลจากภายนอก */
  isVisible?: boolean;
  /** ข้อความที่แสดงด้านล่าง (ค่าเริ่มต้น: "กำลังโหลด") */
  loadingText?: string;
  /** แสดงจุดกระพริบต่อท้ายข้อความหรือไม่ (ค่าเริ่มต้น: true) */
  showDots?: boolean;
  /** ขนาดของ loader (px) (ค่าเริ่มต้น: 200) */
  size?: number;
  /** สีของ loader (ค่าเริ่มต้น: "#ffffff") */
  color?: string;
}

const GeometricLoader: React.FC<GeometricLoaderProps> = ({
  onLoadingComplete,
  duration = 3000,
  isVisible: externalVisible = true,
  loadingText = "กำลังโหลด",
  showDots = true,
  size = 200,
  color = "#ffffff",
}) => {
  const [internalVisible, setInternalVisible] = useState(true);
  const isVisible = externalVisible !== undefined ? externalVisible : internalVisible;

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        if (externalVisible === undefined) {
          setInternalVisible(false);
        }
        onLoadingComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onLoadingComplete, externalVisible, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="geometric-loader-container fixed inset-0 z-50 flex items-center justify-center bg-[#2c2e3a]">
      <style jsx>{`
        .loader-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .wrapper {
          position: relative;
          left: 0;
          top: 0;
          margin: 0;
          width: ${size}px;
          height: ${size}px;
          background-color: transparent;
          border: none;
          -webkit-user-select: none;
          user-select: none;
          filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.3));
        }

        .box-wrap {
          width: 70%;
          height: 70%;
          margin: calc((100% - 70%) / 2) calc((100% - 70%) / 2);
          position: relative;
          transform: rotate(-45deg);
        }

        .box {
          width: 100%;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          background: ${color};
          visibility: hidden;
          will-change: clip-path;
          border-radius: 0;
        }

        .box.one {
          animation: oneMove 3.5s infinite;
        }
        .box.two {
          animation: twoMove 3.5s 0.15s infinite;
        }
        .box.three {
          animation: threeMove 3.5s 0.3s infinite;
        }
        .box.four {
          animation: fourMove 3.5s 0.575s infinite;
        }
        .box.five {
          animation: fiveMove 3.5s 0.725s infinite;
        }
        .box.six {
          animation: sixMove 3.5s 0.875s infinite;
        }

        .loading-text {
          margin-top: 32px;
          text-align: center;
          font-size: ${size * 0.09}px;
          font-weight: 500;
          letter-spacing: 2px;
          color: #e0e0e0;
          text-transform: uppercase;
          position: relative;
          opacity: 0;
          animation: fadeInText 0.6s ease-out 0.8s forwards;
          font-family: 'Sukhumvit Set', 'Prompt', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        }

        .dot {
          display: inline-block;
          animation: blinkDots 1.4s infinite;
        }

        .dot:nth-child(1) {
          animation-delay: 0s;
        }
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes fadeInText {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blinkDots {
          0%, 20% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        /* SLICE 1 */
        @keyframes oneMove {
          0% {
            visibility: visible;
            clip-path: inset(0% 35% 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          14.2857% {
            clip-path: inset(0% 35% 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          28.5714% {
            clip-path: inset(35% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          42.8571% {
            clip-path: inset(35% 70% 35% 0 round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          57.1428% {
            clip-path: inset(35% 70% 35% 0 round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          71.4285% {
            clip-path: inset(0% 70% 70% 0 round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          85.7142% {
            clip-path: inset(0% 70% 70% 0 round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          100% {
            clip-path: inset(0% 35% 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
        }

        /* SLICE 2 */
        @keyframes twoMove {
          0% {
            visibility: visible;
            clip-path: inset(0% 70% 70% 0 round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          14.2857% {
            clip-path: inset(0% 70% 70% 0 round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          28.5714% {
            clip-path: inset(0% 35% 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          42.8571% {
            clip-path: inset(0% 35% 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          57.1428% {
            clip-path: inset(35% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          71.4285% {
            clip-path: inset(35% 70% 35% 0 round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          85.7142% {
            clip-path: inset(35% 70% 35% 0 round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          100% {
            clip-path: inset(0% 70% 70% 0 round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
        }

        /* SLICE 3 */
        @keyframes threeMove {
          0% {
            visibility: visible;
            clip-path: inset(35% 70% 35% 0 round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          14.2857% {
            clip-path: inset(35% 70% 35% 0 round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          28.5714% {
            clip-path: inset(0% 70% 70% 0 round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          42.8571% {
            clip-path: inset(0% 70% 70% 0 round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          57.1428% {
            clip-path: inset(0% 35% 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          71.4285% {
            clip-path: inset(0% 35% 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          85.7142% {
            clip-path: inset(35% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          100% {
            clip-path: inset(35% 70% 35% 0 round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
        }

        /* SLICE 4 */
        @keyframes fourMove {
          0% {
            visibility: visible;
            clip-path: inset(35% 0% 35% 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          14.2857% {
            clip-path: inset(35% 0% 35% 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          28.5714% {
            clip-path: inset(35% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          42.8571% {
            clip-path: inset(70% 35% 0% 35% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          57.1428% {
            clip-path: inset(70% 35% 0% 35% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          71.4285% {
            clip-path: inset(70% 0 0 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          85.7142% {
            clip-path: inset(70% 0 0 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          100% {
            clip-path: inset(35% 0% 35% 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
        }

        /* SLICE 5 */
        @keyframes fiveMove {
          0% {
            visibility: visible;
            clip-path: inset(70% 0 0 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          14.2857% {
            clip-path: inset(70% 0 0 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          28.5714% {
            clip-path: inset(35% 0% 35% 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          42.8571% {
            clip-path: inset(35% 0% 35% 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          57.1428% {
            clip-path: inset(35% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          71.4285% {
            clip-path: inset(70% 35% 0% 35% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          85.7142% {
            clip-path: inset(70% 35% 0% 35% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          100% {
            clip-path: inset(70% 0 0 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
        }

        /* SLICE 6 */
        @keyframes sixMove {
          0% {
            visibility: visible;
            clip-path: inset(70% 35% 0% 35% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          14.2857% {
            clip-path: inset(70% 35% 0% 35% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          28.5714% {
            clip-path: inset(70% 0 0 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          42.8571% {
            clip-path: inset(70% 0 0 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          57.1428% {
            clip-path: inset(35% 0% 35% 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          71.4285% {
            clip-path: inset(35% 0% 35% 70% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          85.7142% {
            clip-path: inset(35% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
          100% {
            clip-path: inset(70% 35% 0% 35% round 5%);
            animation-timing-function: cubic-bezier(0.86, 0, 0.07, 1);
          }
        }

        @media (max-width: 480px) {
          .wrapper {
            transform: scale(0.85);
          }
          .loading-text {
            font-size: ${size * 0.085}px;
            margin-top: 24px;
          }
        }

        /* background subtle pattern */
        .geometric-loader-container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }
      `}</style>

      <div className="loader-container">
        <div className="wrapper">
          <div className="box-wrap">
            <div className="box one"></div>
            <div className="box two"></div>
            <div className="box three"></div>
            <div className="box four"></div>
            <div className="box five"></div>
            <div className="box six"></div>
          </div>
        </div>
        <div className="loading-text">
          {loadingText}
          {showDots && (
            <>
              <span className="dot">.</span>
              <span className="dot">.</span>
              <span className="dot">.</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeometricLoader;