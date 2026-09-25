/**
 * Matching-flow prototype: two phones side by side, guest and host, so
 * both halves of the match can be walked through together. Each phone is
 * its own independent app instance.
 */
import React, { useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { HOST_PROFILE } from './data';
import {
	activeGuest,
	guestState,
	resetSwapState,
	setViewGuest,
	useSwapState,
} from './store';
import { REQUEST_PREVIEWS } from './screens/HostRequest';
import { Avatar, SelfAvatarContext } from './ui';
import './styles.css';

// Natural size of the pair; the stage scales down to fit the window.
const DUO_W = 393 * 2 + 48 + 48; // phones + gap + breathing room
const DUO_H = 830 + 84; // phone + label row + breathing room

function DuoStage() {
	const [scale, setScale] = useState(1);
	// Bumping the run remounts both phones, taking every screen back to
	// its start; the shared swap store is reset alongside.
	const [run, setRun] = useState(0);
	const restart = () => {
		resetSwapState();
		setRun((r) => r + 1);
	};
	const stageRef = useRef<HTMLDivElement>(null);
	// The left phone plays whichever guest Ryan reserved — its label and
	// self-avatar follow along.
	const swap = useSwapState();
	const viewing = activeGuest(swap);
	const guest = REQUEST_PREVIEWS[viewing];
	// Every guest holds their own state now, so the label is a picker:
	// choose whose phone the left column plays.
	const [pickerOpen, setPickerOpen] = useState(false);
	const GUEST_STATUS: Record<string, string> = {
		new: 'Request sent',
		offered: 'Offer received',
		reserved: 'Reserved',
		confirmed: 'Confirmed',
		declined: 'Declined',
		revoked: 'Offer revoked',
	};
	const PICKABLE = ['Melissa', 'Aisha', 'Tash', 'Priya', 'Sara', 'Marco'];

	useLayoutEffect(() => {
		const fit = () => {
			const s = Math.min(
				1,
				(window.innerWidth - 16) / DUO_W,
				(window.innerHeight - 16) / DUO_H,
			);
			setScale(s);
		};
		fit();
		window.addEventListener('resize', fit);
		return () => window.removeEventListener('resize', fit);
	}, []);

	return (
		<div
			className="duo-viewport"
			style={{ width: DUO_W * scale, height: DUO_H * scale }}
		>
			<button className="restart-btn" onClick={restart}>
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.4"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden
				>
					<path d="M3 12a9 9 0 1 0 3-6.7" />
					<polyline points="3 4 3 9 8 9" />
				</svg>
				Restart demo
			</button>
			<div
				ref={stageRef}
				className="duo"
				style={{ width: DUO_W, height: DUO_H, transform: `scale(${scale})` }}
			>
				<div className="duo-col">
					<div className="duo-label picker">
						<button
							className="duo-pick-btn"
							onClick={() => setPickerOpen((o) => !o)}
							aria-expanded={pickerOpen}
							aria-haspopup="listbox"
						>
							<Avatar
								variant={guest.avatar}
								initial={guest.initial}
								size={30}
							/>
							{guest.partner && (
								<span style={{ marginLeft: -14, display: 'inline-flex' }}>
									<Avatar
										variant={guest.partner.avatar}
										initial={guest.partner.initial}
										size={30}
									/>
								</span>
							)}
							<span className="duo-role">Guest</span>
							<span className="duo-name">
								{guest.displayName ?? viewing} {guest.flag}
							</span>
							<svg
								className={`duo-chev${pickerOpen ? ' open' : ''}`}
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.6"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden
							>
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</button>
						{pickerOpen && (
							<>
								<div
									className="duo-menu-overlay"
									onClick={() => setPickerOpen(false)}
								/>
								<div className="duo-menu" role="listbox">
									{PICKABLE.map((g) => {
										const p = REQUEST_PREVIEWS[g];
										const current = g === viewing;
										return (
											<button
												key={g}
												className={`duo-menu-row${current ? ' current' : ''}`}
												role="option"
												aria-selected={current}
												onClick={() => {
													setViewGuest(g);
													setPickerOpen(false);
												}}
											>
												<Avatar
													variant={p.avatar}
													initial={p.initial}
													size={28}
												/>
												<span className="dm-body">
													<span className="dm-name">
														{p.displayName ?? g}
													</span>
													<span className="dm-status">
														{GUEST_STATUS[
															guestState(swap, g)
														] ?? 'Request sent'}
													</span>
												</span>
												{current && (
													<span className="dm-check">✓</span>
												)}
											</button>
										);
									})}
								</div>
							</>
						)}
					</div>
					<div className="phone">
						<SelfAvatarContext.Provider value={guest.avatar}>
							<App key={run} persona="guest" />
						</SelfAvatarContext.Provider>
					</div>
				</div>
				<div className="duo-col">
					<div className="duo-label">
						<Avatar variant="ryan" size={30} />
						<span className="duo-role host">Host</span>
						<span className="duo-name">
							{HOST_PROFILE.name} {HOST_PROFILE.nationalityFlag}
						</span>
					</div>
					<div className="phone">
						<SelfAvatarContext.Provider value="ryan">
							<App key={run} persona="host" />
						</SelfAvatarContext.Provider>
					</div>
				</div>
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<DuoStage />
	</React.StrictMode>,
);
