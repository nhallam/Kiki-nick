/**
 * Fan-out photo deck for the guest-side confirmation: the extra shots of
 * Ryan's place fan out from behind the lead photo shortly after load, then
 * the stack swipes like a deck of cards. The host avatar peeks over the
 * corner — a place-first celebration for the person staying.
 * Uses .confirmed-photo/.deck-card styles in styles.css.
 */
import React, { useEffect, useRef, useState } from 'react';

import { RYAN_PHOTOS } from '../assets';
import { Avatar } from '../ui';

const N = RYAN_PHOTOS.length;

/* Resting pose per depth once fanned: the top card sits straight, the
   three behind it peek out at alternating angles. */
const FAN_POSE = [
	'',
	'rotate(6deg) translate(14px, 2px)',
	'rotate(-7deg) translate(-14px, 2px)',
	'rotate(12deg) translate(26px, 6px)',
];

export function PhotoDeck({
	avatar = 'ryan',
	flag = '🇳🇿',
}: {
	avatar?: string;
	flag?: string;
}) {
	const [fanned, setFanned] = useState(false);
	const [index, setIndex] = useState(0); // which photo is on top
	const [drag, setDrag] = useState<number | null>(null);
	const [leaving, setLeaving] = useState(0); // -1 | 0 | 1 exit direction
	const startX = useRef(0);
	const dragging = useRef(false);

	useEffect(() => {
		const t = setTimeout(() => setFanned(true), 650);
		return () => clearTimeout(t);
	}, []);

	const advance = (dir: number) => {
		setLeaving(dir);
		setDrag(null);
		setTimeout(() => {
			setIndex((i) => (i + 1) % N);
			setLeaving(0);
		}, 260);
	};

	const onPointerDown = (e: React.PointerEvent) => {
		if (!fanned || leaving) return;
		dragging.current = true;
		startX.current = e.clientX;
		setDrag(0);
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	};
	const onPointerMove = (e: React.PointerEvent) => {
		if (!dragging.current) return;
		setDrag(e.clientX - startX.current);
	};
	const onPointerUp = () => {
		if (!dragging.current) return;
		dragging.current = false;
		const d = drag ?? 0;
		if (Math.abs(d) > 55) advance(d > 0 ? 1 : -1);
		else setDrag(null);
	};

	return (
		<div
			className={`confirmed-photo deck${fanned ? ' fanned' : ''}`}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerUp}
		>
			{RYAN_PHOTOS.map((src, i) => {
				const depth = (i - index + N) % N; // 0 = top card
				let transform = fanned ? FAN_POSE[depth] : '';
				let transition;
				if (depth === 0) {
					if (leaving) {
						transform = `translateX(${leaving * 540}px) rotate(${leaving * 24}deg)`;
					} else if (drag != null) {
						transform = `translateX(${drag}px) rotate(${drag / 18}deg)`;
						transition = 'none'; // follow the finger directly
					}
				}
				return (
					<img
						key={src.slice(-24)}
						className="deck-card"
						src={src}
						alt="Ryan's place"
						draggable={false}
						style={{
							transform,
							transition,
							zIndex: N - depth,
							// stagger the initial fan, card by card
							transitionDelay:
								fanned && drag == null && !leaving ? `${depth * 70}ms` : '0ms',
						}}
					/>
				);
			})}
			<span className="confirmed-avatar">
				<Avatar variant={avatar} size={64} flag={flag} />
			</span>
		</div>
	);
}
