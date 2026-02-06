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
            {/* Outer mane - stylized geometric rays */}
            <g fill="currentColor" opacity="0.3">
                <path d="M50 5L55 20L50 15L45 20Z" />
                <path d="M75 12L68 25L65 20L72 18Z" />
                <path d="M90 30L75 35L78 28L82 32Z" />
                <path d="M95 50L80 50L85 45L85 55Z" />
                <path d="M90 70L75 65L78 72L82 68Z" />
                <path d="M75 88L68 75L72 82L65 80Z" />
                <path d="M25 12L32 25L35 20L28 18Z" />
                <path d="M10 30L25 35L22 28L18 32Z" />
                <path d="M5 50L20 50L15 45L15 55Z" />
                <path d="M10 70L25 65L22 72L18 68Z" />
                <path d="M25 88L32 75L28 82L35 80Z" />
            </g>

            {/* Main mane circle */}
            <circle cx="50" cy="50" r="32" fill="currentColor" opacity="0.2" />

            {/* Inner mane detail */}
            <path
                d="M50 22C35 22 24 33 24 48C24 55 27 61 32 65L30 70C30 70 35 75 50 75C65 75 70 70 70 70L68 65C73 61 76 55 76 48C76 33 65 22 50 22Z"
                fill="currentColor"
                opacity="0.4"
            />

            {/* Face base */}
            <ellipse cx="50" cy="52" rx="22" ry="24" fill="currentColor" opacity="0.9" />

            {/* Face details - darker shade */}
            <g fill="#0f172a">
                {/* Eyes */}
                <ellipse cx="40" cy="46" rx="4" ry="5" />
                <ellipse cx="60" cy="46" rx="4" ry="5" />

                {/* Eye shine */}
                <circle cx="41" cy="44" r="1.5" fill="white" opacity="0.8" />
                <circle cx="61" cy="44" r="1.5" fill="white" opacity="0.8" />

                {/* Nose */}
                <path d="M50 52L46 58L50 60L54 58Z" />

                {/* Mouth line */}
                <path d="M50 60L50 64" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                <path d="M44 66C46 68 50 69 50 69C50 69 54 68 56 66" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </g>

            {/* Whisker dots */}
            <g fill="currentColor" opacity="0.6">
                <circle cx="35" cy="58" r="1" />
                <circle cx="32" cy="55" r="1" />
                <circle cx="33" cy="61" r="1" />
                <circle cx="65" cy="58" r="1" />
                <circle cx="68" cy="55" r="1" />
                <circle cx="67" cy="61" r="1" />
            </g>

            {/* Crown accent on forehead */}
            <path
                d="M42 35L45 30L50 33L55 30L58 35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.7"
            />
        </svg>
    );
};

export default LionLogo;
