import type { CSSProperties } from 'react';

export type IconName = 'arrow' | 'grid' | 'layers' | 'flow' | 'people' | 'plus' | 'sun' | 'moon' | 'check' | 'bell' | 'logout' | 'grip' | 'spark' | 'shield';
const paths: Record<IconName, string[]> = {
    arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
    grid: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z'],
    layers: ['m12 3 10 6-10 6L2 9z', 'm2 14 10 6 10-6', 'm2 18 10 6 10-6'],
    flow: ['M4 5h6v6H4z', 'M14 13h6v6h-6z', 'M10 8h6v5', 'm13 10 3 3 3-3'],
    people: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M16 3a4 4 0 0 1 0 8', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],
    plus: ['M12 5v14', 'M5 12h14'],
    sun: ['M12 3V1m0 22v-2M3 12H1m22 0h-2M4.2 4.2 2.8 2.8m18.4 18.4-1.4-1.4M4.2 19.8l-1.4 1.4M21.2 2.8l-1.4 1.4', 'M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0'],
    moon: ['M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z'],
    check: ['m5 12 4 4L19 6'],
    bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9', 'M10 21h4'],
    logout: ['M9 3H4v18h5', 'M9 12h12', 'm17 8 4 4-4 4'],
    grip: ['M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01'],
    spark: ['m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z'],
    shield: ['m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z', 'm8 12 3 3 5-6'],
};

export default function Icon({ name, size = 20, className, style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>
        {paths[name].map((path, index) => <path key={index} d={path} />)}
    </svg>;
}
