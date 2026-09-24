/**
 * One-shot confetti burst for the confirmation screens, echoing the
 * celebration members get when they join the club.
 */
import React from 'react';

const COLORS = ['#20A598', '#6BDDCA', '#F6C445', '#E0533D', '#5B7FB5', '#A9D4D0'];

export function Confetti({ count = 46 }: { count?: number }) {
	const pieces = React.useMemo(
		() =>
			Array.from({ length: count }, (_, i) => ({
				left: Math.random() * 100,
				delay: Math.random() * 0.7,
				dur: 2.4 + Math.random() * 1.5,
				size: 6 + Math.random() * 6,
				color: COLORS[i % COLORS.length],
				spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 420),
				drift: -50 + Math.random() * 100,
				round: Math.random() < 0.3,
			})),
		[count],
	);
	return (
		<div className="confetti" aria-hidden>
			{pieces.map((p, i) => (
				<span
					key={i}
					style={
						{
							left: `${p.left}%`,
							width: p.size,
							height: p.round ? p.size : p.size * 0.55,
							background: p.color,
							borderRadius: p.round ? '50%' : 1.5,
							animationDelay: `${p.delay}s`,
							animationDuration: `${p.dur}s`,
							'--drift': `${p.drift}px`,
							'--spin': `${p.spin}deg`,
						} as React.CSSProperties
					}
				/>
			))}
		</div>
	);
}
