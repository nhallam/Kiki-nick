/**
 * ARCHIVED — not currently mounted anywhere.
 *
 * Fan-out photo deck built for the confirmation screen: the extra shots of
 * the place fan out from behind the lead photo shortly after load, then the
 * stack swipes like a deck of cards. Parked here to be reused on the
 * GUEST side's confirmation later (Melissa seeing Ryan's place), where a
 * place-first celebration makes sense. The host side celebrates the stayer
 * instead. Uses .confirmed-photo/.deck-card styles in styles.css.
 */
import React, { useEffect, useRef, useState } from 'react';

import { RYAN_PHOTOS } from '../assets';
import { Avatar } from '../ui';
import { REQUEST_PREVIEWS } from './HostRequest';

const N = RYAN_PHOTOS.length;

/* Resting pose per depth once fanned: the top card sits straight, the
   three behind it peek out at alternating angles. */
const FAN_POSE = [
	'',
	'rotate(6deg) translate(14px, 2px)',
	'rotate(-7deg) translate(-14px, 2px)',
	'rotate(12deg) translate(26px, 6px)',
];

export function PhotoDeck({ guest }: { guest: string }) {
	const preview = REQUEST_PREVIEWS[guest] ?? REQUEST_PREVIEWS.Melissa;
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
				<Avatar
					variant={preview.avatar}
					initial={preview.initial}
					size={64}
					flag={preview.flag}
				/>
			</span>
		</div>
	);
}
