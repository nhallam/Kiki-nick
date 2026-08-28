/**
 * Host's view of an incoming booking request, laid out with the same
 * summary-card UI as the guest-side booking request (2.4). One entry per
 * requester who can be previewed from the trip's request list.
 */
import React, { useState } from 'react';

import { LISTINGS } from '../data';
import {
	Avatar,
	IconCheck,
	IconChevronDown,
	IconChevronLeft,
	StatusBar,
} from '../ui';
import { guestState, reserveGuest, setGuestState, useSwapState } from '../store';
import { ReviewSummaryCard } from './ReviewRequest';

interface RequestPreview {
	avatar: string;
	initial?: string;
	flag: string;
	occupation: string;
	age: number;
	hometown: string;
	fullName: string;
	/** e.g. 'second' — which Kiki stay this booking is for them */
	stayOrdinal: string;
	nights: number;
	/** Aug day-of-month range, for the overlapping-reservation rule */
	range: [number, number];
	datesValue: string;
	guestsLabel: string;
	intro: string;
	questions: string;
	email: string;
	instagram: string;
	phone: string;
	/** Group bookings: the second guest shown alongside the lead */
	partner?: { name: string; avatar: string; initial?: string };
	/** e.g. 'Tash & Jordan' — used wherever the lead name alone won't do */
	displayName?: string;
	/** 'her' / 'their' — for the celebration copy */
	pronoun?: string;
}

export const REQUEST_PREVIEWS: Record<string, RequestPreview> = {
	Melissa: {
		avatar: 'melissa',
		flag: '🇦🇺',
		occupation: 'Marketing Manager',
		age: 28,
		hometown: 'Melbourne, Australia',
		fullName: 'Melissa Hart',
		stayOrdinal: 'second',
		nights: 3,
		range: [26, 29],
		datesValue: '26 - 29 Aug 2026 · 3 nights',
		guestsLabel: '1 guest · Melissa',
		intro:
			"Hi Ryan! I'm Melissa, a marketing manager from Melbourne over in London for a work sprint. I'm tidy, quiet, and out most of the day — your balcony sold me. Happy to answer anything before you decide.",
		questions:
			'Is it okay to use the balcony in the evenings, and is there somewhere to lock a bike?',
		email: 'melissa.hart@gmail.com',
		instagram: '@melissa.inmelbourne',
		phone: '+61 412 555 083',
	},
	Aisha: {
		avatar: 'aisha',
		initial: 'A',
		flag: '🇬🇧',
		occupation: 'Product Designer',
		age: 29,
		hometown: 'Manchester, UK',
		fullName: 'Aisha Khan',
		stayOrdinal: 'first',
		nights: 2,
		range: [27, 29],
		datesValue: '27 - 29 Aug 2026 · 2 nights',
		guestsLabel: '1 guest · Aisha',
		intro:
			"Hi Ryan! I'm Aisha, a product designer from Manchester in London for a client workshop. I keep things spotless and mostly need a quiet desk in the evenings — your place looks perfect for it.",
		questions:
			'Would an early check-in on the 27th be possible? And is the wifi okay for video calls?',
		email: 'aisha.khan@outlook.com',
		instagram: '@aisha.designs',
		phone: '+44 7700 900412',
	},
	// The group booking (flagged for 3.2): a couple travelling together.
	Tash: {
		avatar: 'tash',
		initial: 'T',
		flag: '🇳🇿',
		occupation: 'Photographer',
		age: 30,
		hometown: 'Wellington, NZ',
		fullName: 'Tash & Jordan Reeves',
		stayOrdinal: 'first',
		nights: 3,
		range: [26, 29],
		datesValue: '26 - 29 Aug 2026 · 3 nights',
		guestsLabel: '2 guests · Tash & Jordan',
		intro:
			"Kia ora Ryan! We're Tash and Jordan, a couple from Wellington over for a friend's wedding. We're easy-going, tidy, and out exploring most days — your place looks like the perfect base.",
		questions:
			'Is the sofa bed comfy enough if one of us is jet-lagged? And any good coffee nearby?',
		email: 'tash.reeves@gmail.com',
		instagram: '@tash.shoots',
		phone: '+64 21 555 380',
		partner: { name: 'Jordan', avatar: 'generic', initial: 'J' },
		displayName: 'Tash & Jordan',
		pronoun: 'their',
	},
};

/** Do two requests fight over the same dates? (day-of-Aug ranges) */
export const rangesOverlap = (a: [number, number], b: [number, number]) =>
	a[0] < b[1] && b[0] < a[1];

/* ---------- Host flow stepper: Booking request → Reserved → Confirmed ---------- */

const FLOW_STEPS = ['Booking request', 'Reserved', 'Confirmed'];

export function HostFlowSteps({
	current,
	complete,
}: {
	/** 1-based index of the stage the user is on */
	current: 1 | 2 | 3;
	/** The flow is finished — every step shows a check */
	complete?: boolean;
}) {
	return (
		<div className="flow-steps">
			{FLOW_STEPS.map((label, i) => {
				const n = i + 1;
				const done = complete || n < current;
				const state = done ? ' done' : n === current ? ' active' : '';
				return (
					<span key={label} className={`fs-step${state}`}>
						<span className="fs-dot">
							{done ? <IconCheck size={10} /> : n}
						</span>
						<span className="fs-label">{label}</span>
					</span>
				);
			})}
		</div>
	);
}

/* ---------- Expandable guest card with contact actions ---------- */

const contactIconProps = {
	width: 17,
	height: 17,
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 2,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
	'aria-hidden': true,
} as const;

const IconMail = () => (
	<svg {...contactIconProps}>
		<rect x="2" y="4" width="20" height="16" rx="3" />
		<path d="M3 6.5l9 7 9-7" />
	</svg>
);

const IconInsta = () => (
	<svg {...contactIconProps}>
		<rect x="3" y="3" width="18" height="18" rx="5" />
		<circle cx="12" cy="12" r="4" />
		<circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
	</svg>
);

const IconPhone = () => (
	<svg {...contactIconProps}>
		<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />
	</svg>
);

/** Contact rows — each opens the right app: mail, Instagram, or the dialler.
    (Was tap-to-copy; per client review, taps should act, not copy.) */
export function ContactRows({
	email,
	instagram,
	phone,
}: {
	email: string;
	instagram: string;
	phone: string;
}) {
	const contacts = [
		{ label: 'Email', icon: <IconMail />, value: email, href: `mailto:${email}` },
		{
			label: 'Instagram',
			icon: <IconInsta />,
			value: instagram,
			href: `https://instagram.com/${instagram.replace(/^@/, '')}`,
		},
		{
			label: 'Call',
			icon: <IconPhone />,
			value: phone,
			href: `tel:${phone.replace(/\s+/g, '')}`,
		},
	];

	return (
		<div className="contact-rows">
			{contacts.map((c) => (
				<a
					key={c.label}
					className="contact-row"
					aria-label={c.label}
					href={c.href}
					target={c.href.startsWith('http') ? '_blank' : undefined}
					rel="noreferrer"
				>
					<span className="c-icon">{c.icon}</span>
					<span className="c-value">{c.value}</span>
				</a>
			))}
		</div>
	);
}

/** The guest header row + expandable contacts, without its own card chrome —
    so it can sit inside another card (the host's request summary). */
export function GuestProfileHeader({
	guest,
	subtitle,
}: {
	guest: string;
	subtitle: string;
}) {
	const preview = REQUEST_PREVIEWS[guest] ?? REQUEST_PREVIEWS.Melissa;
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				className="profile-main"
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
			>
				{preview.partner ? (
					/* Group booking: both guests up front, gently overlapped */
					<span className="pair-avatars">
						<Avatar
							variant={preview.avatar}
							initial={preview.initial}
							size={44}
							flag={preview.flag}
						/>
						<Avatar
							variant={preview.partner.avatar}
							initial={preview.partner.initial}
							size={44}
						/>
					</span>
				) : (
					<Avatar
						variant={preview.avatar}
						initial={preview.initial}
						size={44}
						flag={preview.flag}
					/>
				)}
				<span className="info">
					{/* No inline flag — the avatar already carries one. */}
					<span className="name-row">{preview.displayName ?? guest}</span>
					<span className="subtitle">{subtitle}</span>
				</span>
				<span className={`profile-chev${open ? ' open' : ''}`}>
					<IconChevronDown size={20} />
				</span>
			</button>
			{open && (
				<ContactRows
					email={preview.email}
					instagram={preview.instagram}
					phone={preview.phone}
				/>
			)}
		</>
	);
}

/** Standalone card version (Reserved screen and the guest's steps). */
export function GuestProfileCard({
	guest,
	subtitle,
}: {
	guest: string;
	subtitle: string;
}) {
	return (
		<div className="profile-card expandable">
			<GuestProfileHeader guest={guest} subtitle={subtitle} />
		</div>
	);
}

export function HostRequestScreen({
	guest,
	onBack,
	onDeclined,
	onReserved,
}: {
	guest: string;
	onBack: () => void;
	onDeclined: () => void;
	onReserved: () => void;
}) {
	const listing = LISTINGS.find((l) => l.listerName === 'Ryan')!;
	const preview = REQUEST_PREVIEWS[guest] ?? REQUEST_PREVIEWS.Melissa;
	const rentTotal = preview.nights * listing.nightlyRate;
	const total = rentTotal + listing.securityDeposit;

	const swap = useSwapState();
	const [confirmDecline, setConfirmDecline] = useState(false);
	// Only one reservation per overlapping date range; requests for other
	// dates are unaffected.
	const otherReserved = Object.keys(REQUEST_PREVIEWS).some(
		(g) =>
			g !== guest &&
			guestState(swap, g) !== 'new' &&
			guestState(swap, g) !== 'declined' &&
			rangesOverlap(REQUEST_PREVIEWS[g].range, preview.range),
	);
	const who = preview.displayName ?? guest;

	return (
		<div className="screen">
			<StatusBar time="12:13" />
			{/* The stepper is the heading — it names the stage and shows progress */}
			<div className="form-header review-head with-back">
				<button className="icon-btn review-back" onClick={onBack} aria-label="Back">
					<IconChevronLeft size={26} />
				</button>
				<HostFlowSteps current={1} />
				<span style={{ width: 44 }} />
			</div>

			<div className="form-content" style={{ paddingTop: 16 }}>
				{/* The host knows their own apartment — the card leads with the
				    guest instead, expandable to their contact details */}
				<ReviewSummaryCard
					listing={listing}
					headerSlot={
						<GuestProfileHeader guest={guest} subtitle={preview.datesValue} />
					}
					hasDates
					datesValue={preview.datesValue}
					guestsLabel={preview.guestsLabel}
					nights={preview.nights}
					rentTotal={rentTotal}
					total={total}
					intro={preview.intro}
					questions={preview.questions}
					introDefaultOpen
					replyTo={guest}
					rightAlign
					flat
				/>
			</div>

			<div className="form-footer">
				{otherReserved ? (
					<div className="footer-note">
						You already have a reserved guest for overlapping dates.
					</div>
				) : (
					/* Sits with the actions it explains — quiet, two lines */
					<div className="footer-note soft">
						Accepting reserves {who}'s stay.
						<br />
						Declining lets {preview.partner ? 'them' : 'her'} know.
					</div>
				)}
				<div className="request-actions">
					<button
						className="btn-decline"
						onClick={() => setConfirmDecline(true)}
					>
						Decline
					</button>
					<button
						className="btn-primary"
						disabled={otherReserved}
						onClick={() => {
							reserveGuest(guest);
							onReserved();
						}}
					>
						Accept and Reserve
					</button>
				</div>
			</div>

			{confirmDecline && (
				<div className="sheet-overlay" onClick={() => setConfirmDecline(false)}>
					<div className="dialog-card" onClick={(e) => e.stopPropagation()}>
						<div className="dialog-title">Decline {who}'s request?</div>
						<div className="dialog-sub">
							We'll send {who} a notification to let them know their
							request wasn't successful.
						</div>
						<div className="dialog-actions">
							<button
								className="btn-dialog-cancel"
								onClick={() => setConfirmDecline(false)}
							>
								Cancel
							</button>
							<button
								className="btn-dialog-danger"
								onClick={() => {
									setGuestState(guest, 'declined');
									onDeclined();
								}}
							>
								Decline
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
