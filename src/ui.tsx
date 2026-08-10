/**
 * Shared primitives: inline SVG icons, avatars, placeholder room photos,
 * status bar and tab bar. Everything is self-drawn (no external assets) so the
 * single-file build has zero network dependencies.
 */
import React from 'react';

/* ---------- Icons (24x24 viewBox, stroke-based, Ionicons-ish) ---------- */

type IconProps = { size?: number; color?: string; strokeWidth?: number };

const Svg = ({
	size = 24,
	color = 'currentColor',
	strokeWidth = 2,
	children,
	fill = 'none',
}: IconProps & { children: React.ReactNode; fill?: string }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill={fill}
		stroke={fill === 'none' ? color : 'none'}
		strokeWidth={strokeWidth}
		strokeLinecap="round"
		strokeLinejoin="round"
		style={{ flexShrink: 0 }}
	>
		{children}
	</svg>
);

export const IconSearch = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="11" cy="11" r="7" />
		<line x1="21" y1="21" x2="16.5" y2="16.5" />
	</Svg>
);

export const IconBell = (p: IconProps) => (
	<Svg {...p}>
		<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
		<path d="M13.7 20a2 2 0 0 1-3.4 0" />
	</Svg>
);

export const IconHeart = (p: IconProps & { filled?: boolean }) => (
	<Svg {...p} fill={p.filled ? (p.color ?? 'currentColor') : 'none'}>
		<path
			stroke={p.filled ? 'none' : undefined}
			d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"
		/>
	</Svg>
);

export const IconCalendar = (p: IconProps) => (
	<Svg {...p}>
		<rect x="3" y="4" width="18" height="18" rx="2" />
		<line x1="16" y1="2" x2="16" y2="6" />
		<line x1="8" y1="2" x2="8" y2="6" />
		<line x1="3" y1="10" x2="21" y2="10" />
	</Svg>
);

export const IconCalendarDots = (p: IconProps) => (
	<Svg {...p}>
		<rect x="3" y="4" width="18" height="18" rx="2" />
		<line x1="16" y1="2" x2="16" y2="6" />
		<line x1="8" y1="2" x2="8" y2="6" />
		<line x1="3" y1="10" x2="21" y2="10" />
		<line x1="8" y1="14" x2="8" y2="14.01" />
		<line x1="12" y1="14" x2="12" y2="14.01" />
		<line x1="16" y1="14" x2="16" y2="14.01" />
		<line x1="8" y1="18" x2="8" y2="18.01" />
		<line x1="12" y1="18" x2="12" y2="18.01" />
	</Svg>
);

export const IconChevronLeft = (p: IconProps) => (
	<Svg {...p}>
		<polyline points="15 18 9 12 15 6" />
	</Svg>
);

export const IconChevronRight = (p: IconProps) => (
	<Svg {...p}>
		<polyline points="9 18 15 12 9 6" />
	</Svg>
);

export const IconArrowLeft = (p: IconProps) => (
	<Svg {...p}>
		<line x1="19" y1="12" x2="5" y2="12" />
		<polyline points="12 19 5 12 12 5" />
	</Svg>
);

export const IconClose = (p: IconProps) => (
	<Svg {...p}>
		<line x1="18" y1="6" x2="6" y2="18" />
		<line x1="6" y1="6" x2="18" y2="18" />
	</Svg>
);

export const IconCheck = (p: IconProps) => (
	<Svg {...p} strokeWidth={p.strokeWidth ?? 3}>
		<polyline points="20 6 9 17 4 12" />
	</Svg>
);

export const IconShare = (p: IconProps) => (
	<Svg {...p}>
		<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
		<polyline points="16 6 12 2 8 6" />
		<line x1="12" y1="2" x2="12" y2="15" />
	</Svg>
);

export const IconDotsVertical = (p: IconProps) => (
	<Svg {...p} fill={p.color ?? 'currentColor'}>
		<circle cx="12" cy="5" r="1.7" />
		<circle cx="12" cy="12" r="1.7" />
		<circle cx="12" cy="19" r="1.7" />
	</Svg>
);

export const IconPin = (p: IconProps) => (
	<Svg {...p}>
		<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
		<circle cx="12" cy="10" r="3" />
	</Svg>
);

export const IconStar = (p: IconProps) => (
	<Svg {...p} fill={p.color ?? '#FFB800'}>
		<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
	</Svg>
);

export const IconPerson = (p: IconProps) => (
	<Svg {...p}>
		<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
		<circle cx="12" cy="7" r="4" />
	</Svg>
);

export const IconPersonCircle = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="12" cy="12" r="10" />
		<circle cx="12" cy="9" r="3.2" />
		<path d="M5.5 19a7.5 7.5 0 0 1 13 0" />
	</Svg>
);

export const IconPeople = (p: IconProps) => (
	<Svg {...p}>
		<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
		<path d="M16 3.13a4 4 0 0 1 0 7.75" />
	</Svg>
);

export const IconHome = (p: IconProps) => (
	<Svg {...p}>
		<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
		<polyline points="9 22 9 12 15 12 15 22" />
	</Svg>
);

export const IconAddCircle = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="12" cy="12" r="10" />
		<line x1="12" y1="8" x2="12" y2="16" />
		<line x1="8" y1="12" x2="16" y2="12" />
	</Svg>
);

export const IconCloseCircle = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="12" cy="12" r="10" />
		<line x1="15" y1="9" x2="9" y2="15" />
		<line x1="9" y1="9" x2="15" y2="15" />
	</Svg>
);

export const IconInfo = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="12" cy="12" r="10" />
		<line x1="12" y1="11" x2="12" y2="17" />
		<line x1="12" y1="7.5" x2="12" y2="7.51" />
	</Svg>
);

export const IconDrag = (p: IconProps) => (
	<Svg {...p} fill={p.color ?? 'currentColor'}>
		{[6, 12, 18].map((y) =>
			[8, 16].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />),
		)}
	</Svg>
);

export const IconSend = (p: IconProps) => (
	<Svg {...p}>
		<line x1="22" y1="2" x2="11" y2="13" />
		<polygon points="22 2 15 22 11 13 2 9 22 2" />
	</Svg>
);

export const IconReorderArrows = (p: IconProps) => (
	<Svg {...p}>
		<polyline points="6 8 9 5 12 8" />
		<line x1="9" y1="5" x2="9" y2="19" />
		<polyline points="12 16 15 19 18 16" />
		<line x1="15" y1="5" x2="15" y2="19" />
	</Svg>
);

export const IconMoon = (p: IconProps) => (
	<Svg {...p} fill={p.color ?? 'currentColor'}>
		<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
	</Svg>
);

/* ---------- Status bar / battery ---------- */

export function StatusBar({ time = '12:12' }: { time?: string }) {
	return (
		<div className="status-bar">
			<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
				{time} <IconMoon size={15} />
			</span>
			<span className="right">
				{/* signal */}
				<svg width="19" height="12" viewBox="0 0 19 12">
					{[0, 1, 2, 3].map((i) => (
						<rect
							key={i}
							x={i * 5}
							y={9 - i * 3}
							width="3.4"
							height={3 + i * 3}
							rx="1"
							fill={i < 2 ? '#1F2937' : '#c7c9cc'}
						/>
					))}
				</svg>
				{/* wifi */}
				<svg width="18" height="13" viewBox="0 0 24 18" fill="none" stroke="#1F2937" strokeWidth="2.4" strokeLinecap="round">
					<path d="M2 6a15 15 0 0 1 20 0" />
					<path d="M6 10.5a9.5 9.5 0 0 1 12 0" />
					<path d="M9.5 14.5a5 5 0 0 1 5 0" />
					<circle cx="12" cy="17" r="0.8" fill="#1F2937" stroke="none" />
				</svg>
				{/* battery */}
				<svg width="27" height="13" viewBox="0 0 27 13">
					<rect x="0.5" y="0.5" width="23" height="12" rx="4" fill="#1F2937" />
					<rect x="24.7" y="4" width="2" height="5" rx="1" fill="#c7c9cc" />
					<text x="12" y="9.5" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#fff">
						59
					</text>
				</svg>
			</span>
		</div>
	);
}

/* ---------- Avatar ---------- */

const AVATAR_GRADIENTS: Record<string, string> = {
	ieva: 'linear-gradient(135deg, #2b2b33 0%, #55555f 55%, #8a8a96 100%)',
	me: 'radial-gradient(circle at 35% 35%, #b17be0 0%, #6b2fa8 45%, #2d1152 100%)',
	tash: 'linear-gradient(135deg, #d9a066 0%, #a3683a 100%)',
	jake: 'linear-gradient(135deg, #2f6b3f 0%, #79b06a 100%)',
	sara: 'linear-gradient(135deg, #e8e4de 0%, #b9b1a5 100%)',
	generic: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
};

export function Avatar({
	variant = 'generic',
	initial,
	size = 48,
	flag,
}: {
	variant?: keyof typeof AVATAR_GRADIENTS;
	initial?: string;
	size?: number;
	flag?: string;
}) {
	return (
		<span className="avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>
			<span className="img" style={{ background: AVATAR_GRADIENTS[variant] ?? AVATAR_GRADIENTS.generic }}>
				{variant === 'me' ? (
					<svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
						<path d="M18.7 12.7c0-2 1.7-3 1.7-3s-1-1.6-2.8-1.6c-1.1 0-2 .6-2.6.6-.6 0-1.6-.6-2.7-.6C9.9 8.1 8 9.9 8 12.6c0 2.8 2.2 6.3 3.9 6.3.7 0 1.2-.5 2.1-.5.9 0 1.3.5 2.1.5 1.7 0 3.6-3.3 3.6-4.6-.5-.2-1-.7-1-1.6zM14.9 6.9c.8-1 .7-2.4.7-2.4s-1.3.1-2.2 1.1c-.8.9-.7 2.3-.7 2.3s1.4 0 2.2-1z" />
					</svg>
				) : (
					initial
				)}
			</span>
			{flag && (
				<span className="flag" aria-hidden style={{ fontSize: Math.max(12, size * 0.3) }}>
					{flag}
				</span>
			)}
		</span>
	);
}

/* ---------- Placeholder room photos (pure SVG scenes) ---------- */

export function RoomPhoto({ variant, style }: { variant: string; style?: React.CSSProperties }) {
	if (variant === 'tash') {
		return (
			<svg className="ph-photo" style={style} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
				<rect width="400" height="300" fill="#efe9df" />
				<rect y="210" width="400" height="90" fill="#c8a878" />
				<rect x="20" y="60" width="150" height="90" rx="4" fill="#2f9d8f" />
				<rect x="20" y="160" width="150" height="60" rx="4" fill="#2f9d8f" />
				<rect x="200" y="60" width="90" height="160" rx="4" fill="#3b3b3b" />
				<rect x="300" y="60" width="80" height="160" rx="4" fill="#e8e2d8" />
				<rect x="20" y="150" width="150" height="8" fill="#d9c9a8" />
				<circle cx="95" cy="40" r="18" fill="#f2d38c" />
				<rect x="310" y="80" width="60" height="50" rx="3" fill="#7ea0b8" opacity="0.7" />
			</svg>
		);
	}
	if (variant === 'nina') {
		return (
			<svg className="ph-photo" style={style} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
				<rect width="400" height="300" fill="#f3ece2" />
				<rect y="225" width="400" height="75" fill="#c9b7a0" />
				<rect x="235" y="35" width="130" height="150" rx="6" fill="#cfe0e8" />
				<rect x="292" y="35" width="6" height="150" fill="#f3ece2" />
				<rect x="30" y="120" width="150" height="70" rx="8" fill="#d98b6a" />
				<rect x="46" y="96" width="118" height="26" rx="6" fill="#c47a5b" />
				<circle cx="205" cy="150" r="26" fill="#8ba888" />
				<rect x="198" y="172" width="14" height="22" fill="#a8886a" />
				<rect x="60" y="40" width="70" height="52" rx="4" fill="#e2d3bd" />
				<circle cx="95" cy="66" r="16" fill="#6f6a62" />
				<circle cx="95" cy="66" r="4" fill="#f3ece2" />
			</svg>
		);
	}
	if (variant === 'jake') {
		return (
			<svg className="ph-photo" style={style} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
				<rect width="400" height="300" fill="#2f5233" />
				<circle cx="80" cy="80" r="70" fill="#3d6b41" />
				<circle cx="280" cy="120" r="100" fill="#4a7d4e" />
				<circle cx="180" cy="230" r="80" fill="#356038" />
				<circle cx="350" cy="40" r="50" fill="#568b57" />
				<circle cx="40" cy="220" r="50" fill="#42713f" />
			</svg>
		);
	}
	// 'ieva' — bright room, window wall, paper lamp, sofa (matches reference)
	return (
		<svg className="ph-photo" style={style} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
			<defs>
				<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#b8d4e8" />
					<stop offset="60%" stopColor="#dfeaf2" />
					<stop offset="100%" stopColor="#eef0ee" />
				</linearGradient>
			</defs>
			<rect width="400" height="300" fill="#e9e6e1" />
			{/* window wall */}
			<rect x="40" y="20" width="330" height="230" fill="url(#sky)" />
			{/* clouds */}
			<ellipse cx="150" cy="60" rx="45" ry="14" fill="#fff" opacity="0.85" />
			<ellipse cx="260" cy="45" rx="35" ry="11" fill="#fff" opacity="0.7" />
			{/* distant building */}
			<rect x="60" y="80" width="150" height="70" fill="#aab3ba" />
			{Array.from({ length: 5 }).map((_, r) =>
				Array.from({ length: 12 }).map((_, c) => (
					<rect key={`${r}-${c}`} x={65 + c * 12} y={85 + r * 13} width="8" height="8" fill="#8d979e" />
				)),
			)}
			<rect x="230" y="110" width="70" height="60" fill="#b9a89a" />
			<rect x="310" y="100" width="45" height="80" fill="#c4beb4" />
			{/* window mullions */}
			<rect x="150" y="20" width="8" height="230" fill="#f4f2ef" />
			<rect x="260" y="20" width="8" height="230" fill="#f4f2ef" />
			{/* open door pane */}
			<polygon points="330,20 370,35 370,250 330,250" fill="#f7f6f3" stroke="#d8d5cf" />
			{/* paper lamp */}
			<ellipse cx="235" cy="170" rx="38" ry="32" fill="#f6f0e2" stroke="#e4dcc8" />
			<line x1="235" y1="138" x2="235" y2="120" stroke="#8a8a86" strokeWidth="2" />
			<line x1="235" y1="202" x2="220" y2="260" stroke="#8a8a86" strokeWidth="2.5" />
			<line x1="235" y1="202" x2="252" y2="260" stroke="#8a8a86" strokeWidth="2.5" />
			{/* speaker */}
			<rect x="118" y="150" width="22" height="34" rx="3" fill="#2e2e30" />
			<line x1="129" y1="184" x2="129" y2="250" stroke="#4a4a4c" strokeWidth="3" />
			<rect x="340" y="150" width="20" height="32" rx="3" fill="#2e2e30" />
			{/* sofa */}
			<path d="M0 210 Q10 185 55 188 L120 195 Q140 200 138 225 L138 300 L0 300 Z" fill="#cfc8bb" />
			<ellipse cx="55" cy="200" rx="45" ry="16" fill="#dad3c6" />
			{/* coffee table */}
			<ellipse cx="200" cy="248" rx="52" ry="14" fill="#d6cfc2" />
			<rect x="192" y="252" width="16" height="40" fill="#bdb5a6" />
			<rect x="175" y="238" width="30" height="5" rx="2" fill="#6d675c" />
			{/* floor */}
			<rect y="268" width="400" height="32" fill="#d9cfbe" />
		</svg>
	);
}
