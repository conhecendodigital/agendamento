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
            {/* Outer Mane - Netflix Blue Glow Effect */}
            <g opacity="0.4">
                <polygon points="50,0 56,20 50,16 44,20" fill="currentColor" />
                <polygon points="32,4 42,22 36,20 30,26" fill="currentColor" />
                <polygon points="68,4 70,26 64,20 58,22" fill="currentColor" />
                <polygon points="16,16 32,30 26,30 22,38" fill="currentColor" />
                <polygon points="84,16 78,38 74,30 68,30" fill="currentColor" />
            </g>

            {/* Face Shape */}
            <path
                d="M50 24 C72 24 76 44 76 56 C76 72 66 82 50 82 C34 82 24 72 24 56 C24 44 28 24 50 24Z"
                fill="currentColor"
                opacity="0.95"
            />

            {/* Tech Eyes - Netflix Blue */}
            <circle cx="40" cy="52" r="4" fill="#000" />
            <circle cx="60" cy="52" r="4" fill="#000" />
            <circle cx="40" cy="52" r="1.5" fill="#0071eb" />
            <circle cx="60" cy="52" r="1.5" fill="#0071eb" />

            {/* Tech Circuit Lines */}
            <path d="M50 82 L50 95" stroke="currentColor" strokeWidth="2" opacity="0.6" />
            <circle cx="50" cy="95" r="3" fill="#0071eb" />
        </svg>
    );
};

export default LionLogo;
