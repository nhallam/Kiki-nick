/**
 * Host's view of an incoming booking request, laid out with the same
 * summary-card UI as the guest-side booking request (2.4). One entry per
 * requester who can be previewed from the trip's request list.
 */
import React, { useState } from 'react';

import { RYAN_PHOTOS } from '../assets';
import { LISTINGS } from '../data';
import {
	Avatar,
	IconCheck,
	IconChevronDown,
	IconChevronLeft,
	IconClose,
	StatusBar,
} from '../ui';
import {
	declineGuest,
	guestState,
	sendOffer,
	setGuestState,
	useSwapState,
} from '../store';
import { ReviewSummaryCard } from './ReviewRequest';

interface RequestPreview {
	avatar: string;
	initial?: string;
	flag: string;
	occupation: string;
	age: number;
	gender: string;
	/** Completed Kiki swaps (guest or host) — the trust badge on the booker card */
	kikiMatches: number;
	hometown: string;
	fullName: string;
	/** Overrides "{gender}, {age}" on the booker card (group bookings) */
	personLine?: string;
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
	/** Group bookings: the individual profiles behind the combined card */
	people?: {
		name: string;
		avatar: string;
		initial?: string;
		line: string;
		grewUp: string;
		insta?: string;
	}[];
	/** Names all occupants in the rental agreement (group bookings) */
	occupantsLine?: string;
	/** The lead booker's full name — the one who signs for a group */
	leadFullName?: string;
	/** Stays over 30 nights can split rent into monthly payments; this is
	    when the second month's rent is due */
	splitDue?: string;
	/** Match-timeline day labels, when they differ from the default trip */
	moveInLabel?: string;
	moveOutLabel?: string;
}

export const REQUEST_PREVIEWS: Record<string, RequestPreview> = {
	Melissa: {
		avatar: 'melissa',
		flag: '🇦🇺',
		occupation: 'Marketing Manager',
		age: 28,
		gender: 'Female',
		kikiMatches: 4,
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
		gender: 'Female',
		kikiMatches: 0,
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
		moveInLabel: 'Thursday 27 Aug',
	},
	// The group booking (flagged for 3.2): a couple travelling together.
	Tash: {
		avatar: 'tash',
		initial: 'T',
		flag: '🇳🇿',
		occupation: 'Photographer',
		age: 30,
		gender: 'Female',
		kikiMatches: 2,
		hometown: 'Wellington, NZ',
		fullName: 'Tash & Jordan Reeves',
		personLine: 'Couple, 30 & 32',
		stayOrdinal: 'first',
		// The long stay: over 30 nights, so rent can split into monthly
		// payments (the split-rent scenario)
		nights: 31,
		range: [26, 57],
		datesValue: '26 Aug - 26 Sep 2026 · 31 nights',
		guestsLabel: '2 guests · Tash & Jordan',
		intro:
			"Kia ora Ryan! We're Tash and Jordan, a couple from Wellington over for a friend's wedding and a month of remote work after. We're easy-going, tidy, and out exploring most days — your place looks like the perfect base.",
		questions:
			'Is the sofa bed comfy enough if one of us is jet-lagged? And any good coffee nearby?',
		email: 'tash.reeves@gmail.com',
		instagram: '@tash.shoots',
		phone: '+64 21 555 380',
		partner: { name: 'Jordan', avatar: 'generic', initial: 'J' },
		displayName: 'Tash & Jordan',
		pronoun: 'their',
		people: [
			{
				name: 'Tash Reeves',
				avatar: 'tash',
				line: '30 · Photographer',
				grewUp: 'Grew up in Wellington, NZ',
				insta: '@tash.shoots',
			},
			{
				name: 'Jordan Reeves',
				avatar: 'generic',
				initial: 'J',
				line: '32 · Carpenter',
				grewUp: 'Grew up in Wellington, NZ',
				insta: '@jordy.builds',
			},
		],
		occupantsLine: 'Tash Reeves and Jordan Reeves',
		leadFullName: 'Tash Reeves',
		splitDue: '26 Sep 2026',
		moveOutLabel: 'Saturday 26 Sep',
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
	labels,
}: {
	email: string;
	instagram: string;
	phone: string;
	/** Text labels instead of icons (the request page's contact section) */
	labels?: boolean;
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
			label: 'Phone',
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
					{labels ? (
						<span className="c-label">{c.label}</span>
					) : (
						<span className="c-icon">{c.icon}</span>
					)}
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

/** The booker summary card at the top of the host's request review: who is
    asking to stay, at a glance — name, match count, and the profile basics.
    (Contact details live in their own section at the foot of the page.) */
/* Follower-count mockery for the Instagram screenshots */
const IG_STATS = [
	{ posts: 214, followers: '1,032', following: 840 },
	{ posts: 87, followers: '412', following: 366 },
];
const IG_GRID = [0, 1, 2, 3, 0, 1, 2, 3, 0];

export function BookerCard({ guest }: { guest: string }) {
	const preview = REQUEST_PREVIEWS[guest] ?? REQUEST_PREVIEWS.Melissa;
	// See profile opens the card deck — swipeable when it's a group
	const [showProfiles, setShowProfiles] = useState(false);
	const matchesLabel =
		preview.kikiMatches === 0
			? 'First Kiki match'
			: `${preview.kikiMatches} Kiki matches`;
	const cards = preview.people ?? [
		{
			name: preview.fullName,
			avatar: preview.avatar,
			initial: preview.initial,
			line: `${preview.age} · ${preview.occupation}`,
			grewUp: `Grew up in ${preview.hometown}`,
			insta: preview.instagram,
		},
	];

	return (
		<div className="booker-card">
			<div className="booker-main">
				<span className="booker-top">
					<span className="booker-info">
						{/* First names only; the deck carries the detail */}
						<span className="booker-name">
							{guest}
							{preview.partner && (
								<span className="booker-plus">+1</span>
							)}
							<span className="booker-flag">{preview.flag}</span>
						</span>
						<span className="booker-matches">{matchesLabel}</span>
						<span className="booker-line">
							{preview.personLine ?? `${preview.gender}, ${preview.age}`}
						</span>
						<span className="booker-line">{preview.occupation}</span>
					</span>
					{preview.partner ? (
						<span className="pair-avatars booker">
							<Avatar
								variant={preview.avatar}
								initial={preview.initial}
								size={72}
							/>
							<Avatar
								variant={preview.partner.avatar}
								initial={preview.partner.initial}
								size={72}
							/>
						</span>
					) : (
						<Avatar
							variant={preview.avatar}
							initial={preview.initial}
							size={88}
						/>
					)}
				</span>
				{/* Full-width line — free to run under the photo */}
				<span className="booker-line">Grew up in {preview.hometown}</span>
				<button
					className="booker-people-toggle"
					onClick={() => setShowProfiles(true)}
				>
					{preview.partner ? 'See profiles' : 'See profile'}
				</button>
			</div>

			{showProfiles && (
				/* Full screen, like the agreement: X top right, a centred
				   vertically-scrollable card per guest, swipe across for more */
				<div className="profile-screen">
					<StatusBar time="12:13" />
					<div className="ag-head">
						<span className="ag-title">
							{preview.partner ? 'Profiles' : 'Profile'}
						</span>
						<button
							className="icon-btn"
							onClick={() => setShowProfiles(false)}
							aria-label="Close"
						>
							<IconClose size={24} />
						</button>
					</div>
					<div className="pf-scroller">
						{cards.map((p, i) => (
							<div className="pf-col" key={p.name}>
								<div className="pf-card">
									<Avatar
										variant={p.avatar}
										initial={p.initial}
										size={96}
									/>
									<span className="pf-name">
										{p.name}
										<span className="booker-flag">{preview.flag}</span>
									</span>
									<span className="pf-matches">{matchesLabel}</span>
									<span className="pf-line">{p.line}</span>
									<span className="pf-line">{p.grewUp}</span>
									{/* The Instagram screenshot — the trust artefact */}
									<div className="ig-shot">
										<div className="ig-top">
											<Avatar
												variant={p.avatar}
												initial={p.initial}
												size={40}
											/>
											<span className="ig-id">
												<span className="ig-handle">{p.insta}</span>
												<span className="ig-stats">
													<b>{IG_STATS[i % 2].posts}</b> posts ·{' '}
													<b>{IG_STATS[i % 2].followers}</b> followers ·{' '}
													<b>{IG_STATS[i % 2].following}</b> following
												</span>
											</span>
										</div>
										<div className="ig-grid">
											{IG_GRID.map((n, j) => (
												<img key={j} src={RYAN_PHOTOS[n]} alt="" />
											))}
										</div>
										<span className="ig-tag">From Instagram</span>
									</div>
								</div>
							</div>
						))}
					</div>
					{cards.length > 1 && (
						<div className="pf-hint">Swipe for {preview.partner!.name}</div>
					)}
				</div>
			)}
		</div>
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

/** The reasons a host can send with a decline — the guest sees the one
    chosen, phrased about the stay rather than the person. */
const DECLINE_REASONS = [
	'The dates are no longer available',
	'Not the right fit for this stay',
	'The home is no longer available',
];

export function HostRequestScreen({
	guest,
	onBack,
	onDeclined,
	onOffered,
}: {
	guest: string;
	onBack: () => void;
	onDeclined: () => void;
	/** An offer went out — nothing is reserved until the guest accepts */
	onOffered: () => void;
}) {
	const listing = LISTINGS.find((l) => l.listerName === 'Ryan')!;
	const preview = REQUEST_PREVIEWS[guest] ?? REQUEST_PREVIEWS.Melissa;
	const rentTotal = preview.nights * listing.nightlyRate;
	const total = rentTotal + listing.securityDeposit;

	const swap = useSwapState();
	const [confirmDecline, setConfirmDecline] = useState(false);
	// The guest sees the category (and the note, if written); the host can
	// always see back what was sent, on this screen's read-only snapshot.
	const [declineCategory, setDeclineCategory] = useState<string | null>(null);
	const [declineNote, setDeclineNote] = useState('');
	const declined = guestState(swap, guest) === 'declined';
	const offered = guestState(swap, guest) === 'offered';
	const declineInfo = swap.declines[guest];
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
			<div className="form-header review-head with-back no-rule">
				<button className="icon-btn review-back" onClick={onBack} aria-label="Back">
					<IconChevronLeft size={26} />
				</button>
				<HostFlowSteps current={1} />
				<span style={{ width: 44 }} />
			</div>

			<div className="form-content" style={{ paddingTop: 0 }}>
				{/* Declined: the request stays readable, with a record of
				    exactly what was sent */}
				{declined && (
					<div className="declined-banner">
						<span className="db-title">You declined this request</span>
						<span className="db-line">
							Reason sent: {declineInfo?.category ?? 'No reason recorded'}
						</span>
						{declineInfo?.note && (
							<span className="db-note">“{declineInfo.note}”</span>
						)}
					</div>
				)}
				{/* The host knows their own apartment — the screen leads with who
				    is asking: the booker card, expandable to contact details */}
				<BookerCard guest={guest} />
				<ReviewSummaryCard
					listing={listing}
					noHeader
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

				{/* Contacts sit last — reference material, not part of the decision */}
				<div className="contact-section">
					<div className="contact-section-title">Contact details</div>
					<ContactRows
						email={preview.email}
						instagram={preview.instagram}
						phone={preview.phone}
						labels
					/>
				</div>

				{/* The decision lives at the end of the page, not in a sticky
				    footer — you read everything, then act */}
				<div className="inline-actions">
				{declined ? (
					<div className="footer-note">
						This request is closed — {who} has been notified.
					</div>
				) : offered ? (
					<>
						<div className="footer-note">
							Offer sent — waiting for {who} to accept. Nothing is
							reserved until {preview.partner ? 'they' : 'she'} accept
							{preview.partner ? '' : 's'}.
						</div>
						<button
							className="withdraw-btn"
							onClick={() => {
								setGuestState(guest, 'new');
								onBack();
							}}
						>
							Withdraw offer
						</button>
					</>
				) : otherReserved ? (
					<div className="footer-note">
						You already have an offer out or a reserved guest for
						overlapping dates.
					</div>
				) : (
					/* Sits with the actions it explains — quiet, two lines */
					<div className="footer-note soft">
						Sending an offer lets {who} accept and reserve the stay.
						<br />
						Declining lets {preview.partner ? 'them' : 'her'} know.
					</div>
				)}
				{!declined && !offered && (
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
								sendOffer(guest);
								onOffered();
							}}
						>
							Send offer
						</button>
					</div>
				)}
				</div>
			</div>

			{confirmDecline && (
				<div className="sheet-overlay" onClick={() => setConfirmDecline(false)}>
					<div className="dialog-card" onClick={(e) => e.stopPropagation()}>
						<div className="dialog-title">Decline {who}'s request?</div>
						<div className="dialog-sub">
							{who} will see the reason you choose — and your message, if
							you add one.
						</div>
						<div className="decline-opts">
							{DECLINE_REASONS.map((r) => (
								<button
									key={r}
									className={`decline-opt${declineCategory === r ? ' on' : ''}`}
									onClick={() => setDeclineCategory(r)}
									aria-pressed={declineCategory === r}
								>
									<span className="radio" aria-hidden />
									{r}
								</button>
							))}
						</div>
						<textarea
							className="decline-note"
							placeholder="Add a personal message (optional)"
							value={declineNote}
							onChange={(e) => setDeclineNote(e.target.value)}
						/>
						<div className="dialog-actions">
							<button
								className="btn-dialog-cancel"
								onClick={() => setConfirmDecline(false)}
							>
								Cancel
							</button>
							<button
								className="btn-dialog-danger"
								disabled={!declineCategory}
								onClick={() => {
									declineGuest(guest, declineCategory!, declineNote.trim());
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
