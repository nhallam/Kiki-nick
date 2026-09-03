/**
 * The 48-hour completion window: a live countdown shown while a booking is
 * reserved. Both phones render it from the shared deadline in the store.
 * Tapping the banner explains why the window exists.
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
	const [showInfo, setShowInfo] = useState(false);

	useEffect(() => {
		const t = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(t);
	}, []);

	if (swap.reservedDeadline == null) return null;

	return (
		<>
			<button className="timer-banner" onClick={() => setShowInfo(true)}>
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
				<span className="timer-info" aria-hidden>
					<svg
						width="17"
						height="17"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
					>
						<circle cx="12" cy="12" r="9" />
						<path d="M12 11v5" />
						<path d="M12 8v.01" />
					</svg>
				</span>
			</button>

			{showInfo && (
				<div className="sheet-overlay" onClick={() => setShowInfo(false)}>
					<div className="dialog-card" onClick={(e) => e.stopPropagation()}>
						<div className="dialog-title">Why is there a countdown?</div>
						<div className="dialog-sub">
							Accepting a request reserves the dates, but the booking isn't
							final yet. Both parties have 48 hours to finish the remaining
							steps — signing the rental agreement and paying the deposit and
							rent.
						</div>
						<div className="dialog-sub">
							Once every step is done, the booking confirms automatically. If
							the timer runs out first, the reservation is released so the
							dates aren't left blocked.
						</div>
						<button className="btn-primary" onClick={() => setShowInfo(false)}>
							Got it
						</button>
					</div>
				</div>
			)}
		</>
	);
}
