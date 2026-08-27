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

import { KIKI_LOGO, RYAN_PHOTOS } from '../assets';
import { LISTINGS } from '../data';
import {
	Avatar,
	IconCheck,
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	IconHome,
	IconPersonCircle,
	IconPin,
	StatusBar,
} from '../ui';
import { setSwapState, useSwapState } from '../store';
import { ContactRows, REQUEST_PREVIEWS } from './HostRequest';

const ADDRESS = '6 Sylvester Path, Hackney, London E8';

/* Ryan's side of the contact swap — Melissa's lives in REQUEST_PREVIEWS. */
const RYAN_CONTACT = {
	email: 'ryan.carter@gmail.com',
	instagram: '@ryan.e8',
	phone: '+44 7712 555 019',
};

export function MatchDetailScreen({
	persona,
	onBack,
	onOpenListing,
}: {
	persona?: 'guest' | 'host';
	onBack: () => void;
	onOpenListing: () => void;
}) {
	const swap = useSwapState();
	const guest = 'Melissa';
	const preview = REQUEST_PREVIEWS[guest];
	const listing = LISTINGS.find((l) => l.listerName === 'Ryan')!;
	const rentTotal = preview.nights * listing.nightlyRate;
	const isGuest = persona !== 'host';

	const [showPicker, setShowPicker] = useState(false);
	const [selected, setSelected] = useState<number[]>([]);
	const [showAddressSheet, setShowAddressSheet] = useState(false);
	const [showInstructions, setShowInstructions] = useState(false);
	const [showContact, setShowContact] = useState(false);

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

	// The address action sheet's first option opens this sub-screen: the
	// address written out plus Ryan's how-to-get-in notes.
	if (showInstructions) {
		return (
			<div className="screen">
				<StatusBar time="12:13" />
				<div className="form-header review-head with-back">
					<button
						className="icon-btn review-back"
						onClick={() => setShowInstructions(false)}
						aria-label="Back"
					>
						<IconChevronLeft size={26} />
					</button>
					<span className="match-head-title">
						{isGuest ? "Ryan's instructions" : 'Your instructions'}
					</span>
					<span style={{ width: 44 }} />
				</div>
				<div className="screen-scroll">
					<div className="ins-wrap">
						<div className="ins-address">
							6 Sylvester Path
							<br />
							{listing.area}, {listing.city} E8
						</div>
						<div className="ins-card">
							<div className="ins-title">Finding the apartment</div>
							<div className="ins-text">
								The green door between the bakery and the barber, halfway
								down Sylvester Path. Buzzer 6 has my name on it.
							</div>
						</div>
						<div className="ins-card">
							<div className="ins-title">Lock box</div>
							<div className="ins-text">
								Mounted on the railing just left of the front door. The code
								is 2608 — inside you'll find the keys.
							</div>
						</div>
						<div className="ins-card">
							<div className="ins-title">Keys</div>
							<div className="ins-text">
								Gold key opens the street door, silver key the flat. Please
								pop both back in the lock box when you head off.
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="screen">
			<StatusBar time="12:13" />
			{/* Only the back arrow stays put — the hero scrolls away with the page */}
			<button
				className="icon-btn review-back match-float-back"
				onClick={onBack}
				aria-label="Back"
			>
				<IconChevronLeft size={26} />
			</button>

			<div className="screen-scroll">
				<div className="match-hero">
					<div className="match-avatars">
						{/* The stayer leads; the host peeks out from behind */}
						<span className="match-avatar front">
							<Avatar variant="melissa" size={88} />
						</span>
						<span className="match-avatar back">
							<Avatar variant="ryan" size={88} />
						</span>
					</div>
					<div className="match-dates">26 - 29 Aug · {preview.nights} nights</div>
					<div className="match-where">Melissa at Ryan's apartment</div>
				</div>
				<div className="match-links">
					<button className="match-link" onClick={() => setShowAddressSheet(true)}>
						<IconPin size={18} />
						<span className="ml-text">{ADDRESS}</span>
						<IconChevronRight size={18} />
					</button>
					<button className="match-link" onClick={onOpenListing}>
						<IconHome size={18} />
						<span className="ml-text">View listing</span>
						<IconChevronRight size={18} />
					</button>
					<button
						className="match-link"
						onClick={() => setShowContact((o) => !o)}
						aria-expanded={showContact}
					>
						<IconPersonCircle size={18} />
						<span className="ml-text">Contact details</span>
						<span className={`ml-chev${showContact ? ' open' : ''}`}>
							<IconChevronDown size={18} />
						</span>
					</button>
					{/* Contextual: each side sees the other person's details */}
					{showContact &&
						(isGuest ? (
							<ContactRows
								email={RYAN_CONTACT.email}
								instagram={RYAN_CONTACT.instagram}
								phone={RYAN_CONTACT.phone}
							/>
						) : (
							<ContactRows
								email={preview.email}
								instagram={preview.instagram}
								phone={preview.phone}
							/>
						))}
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

				<div className="match-farewell">
					<img className="mf-logo" src={KIKI_LOGO} alt="Kiki" />
					<div className="mf-text">
						Have a great stay!
						<br />
						From Toby and the Kiki Team
					</div>
				</div>
			</div>

			{showAddressSheet && (
				<div
					className="sheet-overlay"
					onClick={() => setShowAddressSheet(false)}
				>
					<div className="action-sheet" onClick={(e) => e.stopPropagation()}>
						<div className="as-group">
							<button
								className="as-option"
								onClick={() => {
									setShowAddressSheet(false);
									setShowInstructions(true);
								}}
							>
								{isGuest ? "Show Ryan's instructions" : 'Show your instructions'}
							</button>
							<button
								className="as-option"
								onClick={() => setShowAddressSheet(false)}
							>
								Open in Google Maps
							</button>
							<button
								className="as-option"
								onClick={() => setShowAddressSheet(false)}
							>
								Open in Apple Maps
							</button>
						</div>
						<button
							className="as-cancel"
							onClick={() => setShowAddressSheet(false)}
						>
							Cancel
						</button>
					</div>
				</div>
			)}

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
