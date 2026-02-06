import React from 'react';

interface LionLogoProps {
    size?: number;
    className?: string;
}

export const LionLogo: React.FC<LionLogoProps> = ({ size = 64, className = '' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Outer Mane - Geometric Flame Rays */}
            <g opacity="0.25">
                {/* Top center ray */}
                <polygon points="50,0 56,20 50,16 44,20" fill="currentColor" />
                {/* Top side rays */}
                <polygon points="32,4 42,22 36,20 30,26" fill="currentColor" />
                <polygon points="68,4 70,26 64,20 58,22" fill="currentColor" />
                {/* Upper side rays */}
                <polygon points="16,16 32,30 26,30 22,38" fill="currentColor" />
                <polygon points="84,16 78,38 74,30 68,30" fill="currentColor" />
                {/* Mid side rays */}
                <polygon points="6,36 24,42 22,48 26,54" fill="currentColor" />
                <polygon points="94,36 74,54 78,48 76,42" fill="currentColor" />
                {/* Lower side rays */}
                <polygon points="4,56 22,56 22,62 26,70" fill="currentColor" />
                <polygon points="96,56 74,70 78,62 78,56" fill="currentColor" />
                {/* Bottom rays */}
                <polygon points="14,74 30,66 30,72 36,80" fill="currentColor" />
                <polygon points="86,74 64,80 70,72 70,66" fill="currentColor" />
            </g>

            {/* Middle Mane Layer - Sharper Triangles */}
            <g opacity="0.45">
                <polygon points="50,10 56,26 50,22 44,26" fill="currentColor" />
                <polygon points="30,14 40,28 34,26 28,34" fill="currentColor" />
                <polygon points="70,14 72,34 66,26 60,28" fill="currentColor" />
                <polygon points="18,30 34,40 28,42 26,50" fill="currentColor" />
                <polygon points="82,30 74,50 72,42 66,40" fill="currentColor" />
                <polygon points="12,50 28,52 26,58 30,66" fill="currentColor" />
                <polygon points="88,50 70,66 74,58 72,52" fill="currentColor" />
                <polygon points="20,70 34,64 34,70 40,78" fill="currentColor" />
                <polygon points="80,70 60,78 66,70 66,64" fill="currentColor" />
            </g>

            {/* Inner Mane Base - Solid Circle */}
            <circle cx="50" cy="52" r="30" fill="currentColor" opacity="0.65" />

            {/* Face Shield Shape */}
            <path
                d="M50 24 C72 24 76 44 76 56 C76 72 66 82 50 82 C34 82 24 72 24 56 C24 44 28 24 50 24Z"
                fill="currentColor"
                opacity="0.9"
            />

            {/* V Symbol on Forehead - Crown Mark */}
            <g opacity="0.5">
                <path
                    d="M38 32 L50 46 L62 32"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    filter="url(#glow)"
                />
                {/* V accent dot */}
                <circle cx="50" cy="46" r="2" fill="currentColor" opacity="0.7" />
            </g>

            {/* Eyes - Fierce & Determined */}
            <g>
                {/* Left eye socket */}
                <ellipse cx="38" cy="52" rx="8" ry="6" fill="currentColor" opacity="0.95" />
                {/* Left eye inner */}
                <ellipse cx="38" cy="52" rx="5" ry="4" fill="#0f172a" />
                {/* Left pupil */}
                <ellipse cx="39" cy="51" rx="2.5" ry="2" fill="currentColor" />
                {/* Left eye highlight */}
                <circle cx="40" cy="50" r="1" fill="currentColor" opacity="0.9" />

                {/* Right eye socket */}
                <ellipse cx="62" cy="52" rx="8" ry="6" fill="currentColor" opacity="0.95" />
                {/* Right eye inner */}
                <ellipse cx="62" cy="52" rx="5" ry="4" fill="#0f172a" />
                {/* Right pupil */}
                <ellipse cx="63" cy="51" rx="2.5" ry="2" fill="currentColor" />
                {/* Right eye highlight */}
                <circle cx="64" cy="50" r="1" fill="currentColor" opacity="0.9" />

                {/* Eyebrows - Strong Angular */}
                <path d="M28 46 L38 44 L46 48" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
                <path d="M72 46 L62 44 L54 48" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            </g>

            {/* Nose Bridge */}
            <path
                d="M50 50 L50 60"
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.3"
            />

            {/* Nose - Strong Triangular */}
            <path
                d="M44 62 L50 68 L56 62 Z"
                fill="#0f172a"
                opacity="0.5"
            />
            <ellipse cx="50" cy="64" rx="5" ry="3" fill="#0f172a" opacity="0.4" />

            {/* Mouth/Muzzle Lines */}
            <path
                d="M50 68 L50 72"
                stroke="#0f172a"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.35"
            />
            <path
                d="M42 74 Q50 80 58 74"
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                opacity="0.4"
            />

            {/* Whisker Marks */}
            <g opacity="0.25">
                <circle cx="32" cy="62" r="1.5" fill="#0f172a" />
                <circle cx="30" cy="68" r="1.5" fill="#0f172a" />
                <circle cx="68" cy="62" r="1.5" fill="#0f172a" />
                <circle cx="70" cy="68" r="1.5" fill="#0f172a" />
            </g>

            {/* Crown Points */}
            <g opacity="0.7">
                <path
                    d="M38 22 L44 14 L50 20 L56 14 L62 22"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />
                {/* Crown jewel */}
                <circle cx="50" cy="14" r="3" fill="currentColor" />
                <circle cx="44" cy="16" r="1.5" fill="currentColor" opacity="0.6" />
                <circle cx="56" cy="16" r="1.5" fill="currentColor" opacity="0.6" />
            </g>

            {/* Cheek Accents */}
            <circle cx="28" cy="50" r="3" fill="currentColor" opacity="0.35" />
            <circle cx="72" cy="50" r="3" fill="currentColor" opacity="0.35" />

            {/* Subtle Glow Filter Definition */}
            <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
        </svg>
    );
};

export default LionLogo;
