/**
 * The 48-hour completion window: a live countdown shown while a booking is
 * reserved. Both phones render it from the shared deadline in the store.
 */
import React, { useEffect, useState } from 'react';

import { useSwapState } from '../store';

const pad = (n: number) => String(n).padStart(2, '0');

function format(msLeft: number): string {
	const s = Math.max(0, Math.floor(msLeft / 1000));
	return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function ReserveTimer({ note }: { note: string }) {
	const swap = useSwapState();
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const t = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(t);
	}, []);

	if (swap.reservedDeadline == null) return null;

	return (
		<div className="timer-banner">
			<span className="timer-clock" aria-hidden>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
				>
					<circle cx="12" cy="12" r="9" />
					<path d="M12 7v5l3.5 2" />
				</svg>
			</span>
			<span className="timer-value">{format(swap.reservedDeadline - now)}</span>
			<span className="timer-note">{note}</span>
		</div>
	);
}
