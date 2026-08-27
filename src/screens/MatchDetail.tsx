/**
 * A confirmed match, opened from the Matches card on either phone: the two
 * swappers together up top, then a vertical timeline of everything that
 * happens around the stay — paperwork, payments, the stay itself, the
 * condition photos that bookend it, and the deposit refund at the end.
 *
 * Condition photos: the "before" set is Ryan's (pre-filled, read-only);
 * the "after" set belongs to Melissa — only her phone can add or edit it,
 * Ryan just sees the result.
 */
import React, { useState } from 'react';

import { RYAN_PHOTOS } from '../assets';
import { LISTINGS } from '../data';
import { Avatar, IconCheck, IconChevronLeft, StatusBar } from '../ui';
import { setSwapState, useSwapState } from '../store';
import { REQUEST_PREVIEWS } from './HostRequest';

export function MatchDetailScreen({
	persona,
	onBack,
}: {
	persona?: 'guest' | 'host';
	onBack: () => void;
}) {
	const swap = useSwapState();
	const guest = 'Melissa';
	const preview = REQUEST_PREVIEWS[guest];
	const listing = LISTINGS.find((l) => l.listerName === 'Ryan')!;
	const rentTotal = preview.nights * listing.nightlyRate;
	const isGuest = persona !== 'host';

	const [showPicker, setShowPicker] = useState(false);
	const [selected, setSelected] = useState<number[]>([]);

	const openPicker = () => {
		setSelected(swap.afterPhotos);
		setShowPicker(true);
	};
	const savePhotos = () => {
		setSwapState({ afterPhotos: selected });
		setShowPicker(false);
	};

	const afterCount = swap.afterPhotos.length;

	// The "after" step is the one interactive event — its dot, sub-line and
	// body depend on whether photos exist and whose phone this is.
	const afterStep = (
		<div className="tl-item" key="after">
			<span className="tl-line" aria-hidden />
			<span className={`tl-dot${afterCount > 0 ? ' done' : ''}`}>
				{afterCount > 0 && <IconCheck size={13} />}
			</span>
			<span className="tl-body">
				<span className="tl-title">Condition photos · after</span>
				{afterCount > 0 ? (
					<>
						<span className="tl-sub">
							{isGuest
								? `${afterCount} photo${afterCount > 1 ? 's' : ''} added · tap to edit`
								: `Added by ${guest}`}
						</span>
						<button
							className="tl-thumb"
							onClick={isGuest ? openPicker : undefined}
							disabled={!isGuest}
							aria-label={isGuest ? 'Edit condition photos' : undefined}
						>
							<img src={RYAN_PHOTOS[swap.afterPhotos[0]]} alt="" />
							{afterCount > 1 && (
								<span className="tl-thumb-count">+{afterCount - 1}</span>
							)}
						</button>
					</>
				) : (
					<>
						<span className="tl-sub">
							{isGuest
								? 'Document the apartment when you move out'
								: `${guest} adds these when she moves out`}
						</span>
						{isGuest && (
							<button className="tl-add-btn" onClick={openPicker}>
								Add photos
							</button>
						)}
					</>
				)}
			</span>
		</div>
	);

	interface StaticItem {
		title: string;
		sub: string;
		done: boolean;
		thumb?: string;
	}

	const beforeItems: StaticItem[] = [
		{
			title: 'Rental agreement',
			sub: `Signed by ${guest} and Ryan`,
			done: swap.guestSigned && swap.hostSigned,
		},
		{
			title: 'Deposit paid',
			sub: `£${listing.securityDeposit} held by Kiki`,
			done: swap.depositPaid,
		},
		{
			title: 'Rent paid',
			sub: `£${rentTotal} · paid to Ryan 3 days after move-in`,
			done: swap.rentPaid,
		},
		{
			title: 'Condition photos · before',
			sub: 'Added by Ryan before move-in',
			done: true,
			thumb: RYAN_PHOTOS[1],
		},
		{ title: 'Move-in', sub: 'Wednesday 26 Aug', done: false },
		{ title: 'Move-out', sub: 'Saturday 29 Aug', done: false },
	];

	const refund: StaticItem = {
		title: 'Security deposit refund',
		sub: isGuest
			? `£${listing.securityDeposit} back to you 3 days after move-out, unless contested by Ryan`
			: `£${listing.securityDeposit} returned to ${guest} 3 days after move-out`,
		done: false,
	};

	const renderStatic = (item: StaticItem, last: boolean, nextDone: boolean) => (
		<div key={item.title} className="tl-item">
			{!last && (
				<span
					className={`tl-line${item.done && nextDone ? ' done' : ''}`}
					aria-hidden
				/>
			)}
			<span className={`tl-dot${item.done ? ' done' : ''}`}>
				{item.done && <IconCheck size={13} />}
			</span>
			<span className="tl-body">
				<span className="tl-title">{item.title}</span>
				<span className="tl-sub">{item.sub}</span>
				{item.thumb && (
					<span className="tl-thumb static">
						<img src={item.thumb} alt="" />
					</span>
				)}
			</span>
		</div>
	);

	return (
		<div className="screen">
			<StatusBar time="12:13" />
			<div className="form-header review-head with-back">
				<button className="icon-btn review-back" onClick={onBack} aria-label="Back">
					<IconChevronLeft size={26} />
				</button>
				<span className="match-head-title">Match</span>
				<span style={{ width: 44 }} />
			</div>

			<div className="screen-scroll">
				<div className="match-hero">
					<div className="match-avatars">
						{/* The stayer leads; the host peeks out from behind */}
						<span className="match-avatar front">
							<Avatar variant="melissa" size={88} flag="🇦🇺" />
						</span>
						<span className="match-avatar back">
							<Avatar variant="ryan" size={88} flag="🇳🇿" />
						</span>
					</div>
					<div className="match-dates">26 - 29 Aug · {preview.nights} nights</div>
					<div className="match-where">Melissa at Ryan's apartment</div>
					<div className="match-address">
						6 Sylvester Path, {listing.area}, {listing.city} E8
					</div>
				</div>

				<div className="timeline">
					{beforeItems.map((item, i) =>
						renderStatic(
							item,
							false,
							i < beforeItems.length - 1 ? beforeItems[i + 1].done : afterCount > 0,
						),
					)}
					{afterStep}
					{renderStatic(refund, true, false)}
				</div>
			</div>

			{showPicker && (
				<div className="sheet-overlay" onClick={() => setShowPicker(false)}>
					<div className="photo-picker" onClick={(e) => e.stopPropagation()}>
						<div className="pp-title">Condition photos</div>
						<div className="pp-sub">
							Choose photos showing the state of the apartment
						</div>
						<div className="pp-grid">
							{RYAN_PHOTOS.map((src, i) => {
								const on = selected.includes(i);
								return (
									<button
										key={i}
										className={`pp-cell${on ? ' selected' : ''}`}
										onClick={() =>
											setSelected((s) =>
												on ? s.filter((x) => x !== i) : [...s, i],
											)
										}
										aria-pressed={on}
									>
										<img src={src} alt="" />
										<span className="pp-check">
											{on && <IconCheck size={12} />}
										</span>
									</button>
								);
							})}
						</div>
						<button
							className="btn-primary"
							disabled={selected.length === 0}
							onClick={savePhotos}
						>
							{afterCount > 0
								? 'Save'
								: `Add ${selected.length || ''} photo${selected.length === 1 ? '' : 's'}`}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
