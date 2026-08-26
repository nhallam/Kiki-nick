/**
 * Host's view of an incoming booking request, laid out with the same
 * summary-card UI as the guest-side booking request (2.4). One entry per
 * requester who can be previewed from the trip's request list.
 */
import React, { useRef, useState } from 'react';

import { LISTINGS } from '../data';
import {
	Avatar,
	IconCheck,
	IconChevronDown,
	IconChevronLeft,
	StatusBar,
} from '../ui';
import { guestState, setGuestState, useSwapState } from '../store';
import { ReviewSummaryCard } from './ReviewRequest';

interface RequestPreview {
	avatar: string;
	initial?: string;
	flag: string;
	occupation: string;
	age: number;
	nights: number;
	datesValue: string;
	guestsLabel: string;
	intro: string;
	questions: string;
	email: string;
	instagram: string;
	phone: string;
}

export const REQUEST_PREVIEWS: Record<string, RequestPreview> = {
	Melissa: {
		avatar: 'melissa',
		flag: '🇦🇺',
		occupation: 'Marketing Manager',
		age: 28,
		nights: 3,
		datesValue: '26th Aug – 29th Aug 2026 · 3 nights',
		guestsLabel: 'Just Melissa',
		intro:
			"Hi Ryan! I'm Melissa, a marketing manager from Sydney over in London for a work sprint. I'm tidy, quiet, and out most of the day — your balcony sold me. Happy to answer anything before you decide.",
		questions:
			'Is it okay to use the balcony in the evenings, and is there somewhere to lock a bike?',
		email: 'melissa.hart@gmail.com',
		instagram: '@melissa.insydney',
		phone: '+61 412 555 083',
	},
	Aisha: {
		avatar: 'aisha',
		initial: 'A',
		flag: '🇬🇧',
		occupation: 'Product Designer',
		age: 29,
		nights: 2,
		datesValue: '27th Aug – 29th Aug 2026 · 2 nights',
		guestsLabel: 'Just Aisha',
		intro:
			"Hi Ryan! I'm Aisha, a product designer from Manchester in London for a client workshop. I keep things spotless and mostly need a quiet desk in the evenings — your place looks perfect for it.",
		questions:
			'Would an early check-in on the 27th be possible? And is the wifi okay for video calls?',
		email: 'aisha.khan@outlook.com',
		instagram: '@aisha.designs',
		phone: '+44 7700 900412',
	},
};

/* ---------- Expandable guest card with tap-to-copy contact details ---------- */

const IconCopy = ({ size = 16 }: { size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden
	>
		<rect x="9" y="9" width="12" height="12" rx="2.5" />
		<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
	</svg>
);

function copyText(text: string) {
	// Clipboard API needs a secure context; fall back to the classic
	// hidden-textarea trick so copying also works inside the gallery iframe.
	const fallback = () => {
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.appendChild(ta);
		ta.select();
		try {
			document.execCommand('copy');
		} catch {
			/* prototype: feedback still shows */
		}
		document.body.removeChild(ta);
	};
	if (navigator.clipboard?.writeText) {
		navigator.clipboard.writeText(text).catch(fallback);
	} else {
		fallback();
	}
}

export function GuestProfileCard({
	guest,
	subtitle,
}: {
	guest: string;
	subtitle: string;
}) {
	const preview = REQUEST_PREVIEWS[guest] ?? REQUEST_PREVIEWS.Melissa;
	const [open, setOpen] = useState(false);
	const [copied, setCopied] = useState<string | null>(null);
	const timer = useRef<number>();

	const copy = (label: string, value: string) => {
		copyText(value);
		setCopied(label);
		window.clearTimeout(timer.current);
		timer.current = window.setTimeout(() => setCopied(null), 1600);
	};

	const contacts = [
		{ label: 'Email', value: preview.email },
		{ label: 'Instagram', value: preview.instagram },
		{ label: 'Phone number', value: preview.phone },
	];

	return (
		<div className="profile-card expandable">
			<button
				className="profile-main"
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
			>
				<Avatar
					variant={preview.avatar}
					initial={preview.initial}
					size={44}
					flag={preview.flag}
				/>
				<span className="info">
					{/* No inline flag — the avatar already carries one. */}
					<span className="name-row">{guest}</span>
					<span className="subtitle">{subtitle}</span>
				</span>
				<span className={`profile-chev${open ? ' open' : ''}`}>
					<IconChevronDown size={20} />
				</span>
			</button>
			{open && (
				<div className="contact-rows">
					{contacts.map((c) => (
						<button
							key={c.label}
							className="contact-row"
							onClick={() => copy(c.label, c.value)}
						>
							<span className="c-label">{c.label}</span>
							<span className="c-value">{c.value}</span>
							{copied === c.label ? (
								<span className="c-copied">
									<IconCheck size={11} /> Copied
								</span>
							) : (
								<span className="c-copy">
									<IconCopy size={16} />
								</span>
							)}
						</button>
					))}
				</div>
			)}
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
	// Only one request can be reserved at a time for these dates.
	const otherReserved =
		['Melissa', 'Aisha'].some(
			(g) => g !== guest && guestState(swap, g) !== 'new' && guestState(swap, g) !== 'declined',
		);

	return (
		<div className="screen">
			<StatusBar time="12:13" />
			<div className="form-header review-head with-back">
				<button className="icon-btn review-back" onClick={onBack} aria-label="Back">
					<IconChevronLeft size={26} />
				</button>
				<span className="review-head-titles">
					<span className="review-head-title">Booking request</span>
				</span>
				{/* mirrors the flow header's right slot so the title centres */}
				<span style={{ width: 44 }} />
			</div>

			<div className="form-content" style={{ paddingTop: 16 }}>
				{/* Who it's from */}
				<GuestProfileCard
					guest={guest}
					subtitle={`${preview.occupation}, ${preview.age}`}
				/>

				<ReviewSummaryCard
					listing={listing}
					hasDates
					datesValue={preview.datesValue}
					guestsLabel={preview.guestsLabel}
					nights={preview.nights}
					rentTotal={rentTotal}
					total={total}
					intro={preview.intro}
					questions={preview.questions}
				/>
			</div>

			<div className="form-footer">
				{otherReserved && (
					<div className="footer-note">
						You already have a reserved guest for these dates.
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
							setGuestState(guest, 'reserved');
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
						<div className="dialog-title">Decline {guest}'s request?</div>
						<div className="dialog-sub">
							We'll send {guest} a notification to let them know their
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
