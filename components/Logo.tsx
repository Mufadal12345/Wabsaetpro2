import React from "react";

export const Logo: React.FC<{ size?: number; animate?: boolean }> = ({
  size = 140,
  animate = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animate ? "animate-float" : ""} filter drop-shadow-[0_0_20px_rgba(233,69,96,0.5)]`}
    >
      <defs>
        <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#4F46E5", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#E94560", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#F59E0B", stopOpacity: 1 }} />
        </linearGradient>
        
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#FDE68A", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#F59E0B", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#B45309", stopOpacity: 1 }} />
        </linearGradient>

        <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        <radialGradient id="innerGlow">
          <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.4 }} />
          <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      {/* Outer Ring */}
      <circle
        cx="70"
        cy="70"
        r="66"
        fill="none"
        stroke="url(#mainGradient)"
        strokeWidth="1"
        strokeDasharray="4 4"
        className={animate ? "animate-spin-slow" : ""}
        opacity="0.4"
      />

      {/* Background Circle */}
      <circle cx="70" cy="70" r="60" fill="#0f172a" stroke="url(#goldGradient)" strokeWidth="2" />
      <circle cx="70" cy="70" r="55" fill="url(#innerGlow)" opacity="0.2" />

      {/* Museum Structure */}
      <g transform="translate(35, 45)">
        {/* Pediment (Top Triangle) */}
        <path
          d="M35 0 L75 25 L-5 25 Z"
          fill="url(#goldGradient)"
          filter="url(#strongGlow)"
        />
        
        {/* Architrave (Beam below triangle) */}
        <rect x="-5" y="25" width="80" height="6" fill="url(#goldGradient)" rx="1" />
        
        {/* Pillars */}
        <g fill="url(#goldGradient)">
          <rect x="5" y="31" width="8" height="40" rx="1" />
          <rect x="23.3" y="31" width="8" height="40" rx="1" />
          <rect x="41.6" y="31" width="8" height="40" rx="1" />
          <rect x="59.9" y="31" width="8" height="40" rx="1" />
        </g>
        
        {/* Base (Steps) */}
        <rect x="-10" y="71" width="90" height="6" fill="url(#goldGradient)" rx="1" />
        <rect x="-15" y="77" width="100" height="6" fill="url(#goldGradient)" rx="1" />
      </g>

      {/* Central Glowing Thought Spark */}
      <g transform="translate(70, 78)">
        <circle r="15" fill="url(#mainGradient)" filter="url(#strongGlow)" opacity="0.8">
          {animate && (
            <animate
              attributeName="opacity"
              values="0.6;0.9;0.6"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        <path
          d="M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5 Z"
          fill="white"
          className={animate ? "animate-pulse" : ""}
        />
      </g>

      {/* Floating Particles */}
      {animate && (
        <g fill="#fbbf24" opacity="0.6">
          <circle cx="30" cy="30" r="1.5">
            <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="110" cy="40" r="1.5">
            <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="40" cy="110" r="1.5">
            <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="100" r="1.5">
            <animate attributeName="opacity" values="0;1;0" dur="3.5s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  );
};
