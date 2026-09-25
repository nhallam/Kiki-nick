/**
 * Host's view of one trip: the trip dates up top, then every booking
 * request that has come in against those dates — newest first.
 */
import React, { useState } from 'react';

import {
	Avatar,
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	StatusBar,
} from '../ui';
import { guestState, useSwapState } from '../store';
import { REQUEST_PREVIEWS } from './HostRequest';

const IconPencil = ({ size = 18 }: { size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
	</svg>
);

const IconTrash = ({ size = 18 }: { size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
		<path d="M10 11v6M14 11v6" />
	</svg>
);

interface TripBookingRequest {
	id: number;
	name: string;
	avatar: string;
	initial?: string;
	sub: string;
	/** new = untouched, inReview = opened but not actioned */
	status?: 'new' | 'inReview' | 'declined' | 'reserved' | 'confirmed';
}

/* H4b treatment: label + colour class for the right-aligned status column */
const ROW_STAT: Record<string, [string, string]> = {
	new: ['New', 'teal'],
	inReview: ['In review', 'amber'],
	offered: ['Offer sent', 'amber'],
	reserved: ['Reserved', 'amber'],
	confirmed: ['Confirmed', 'teal'],
	revoked: ['Offer revoked', 'grey'],
	declined: ['Declined', 'red'],
};

export const TRIP_REQUESTS: TripBookingRequest[] = [
	{
		id: 1,
		name: 'Melissa',
		avatar: 'melissa',
		sub: '26 - 29 Aug · £201',
		status: 'new',
	},
	{
		id: 2,
		name: 'Aisha',
		avatar: 'aisha',
		initial: 'A',
		sub: '27 - 29 Aug · £134',
		status: 'new',
	},
	{
		// The group booking — live like Melissa's and Aisha's (v3.2)
		id: 3,
		name: 'Tash',
		avatar: 'tash',
		initial: 'T',
		sub: '26 Aug - 26 Sep · £2,077',
		status: 'new',
	},
	{
		// The long stay — 3 monthly rent instalments (75 nights @ £67)
		id: 6,
		name: 'Priya',
		avatar: 'priya',
		initial: 'P',
		sub: '1 Oct - 15 Dec · £5,025',
		status: 'new',
	},
	{
		id: 4,
		name: 'Sara',
		avatar: 'sara',
		initial: 'S',
		sub: '26 - 28 Aug · £134',
		status: 'declined',
	},
	{
		id: 5,
		name: 'Marco',
		avatar: 'marco',
		initial: 'M',
		sub: '26 - 29 Aug · £201',
		status: 'declined',
	},
];

export function TripRequestsScreen({
	onBack,
	onOpenRequest,
	onOpenReserved,
	onOpenMatch,
}: {
	onBack: () => void;
	/** Open a request's preview screen; only requesters with preview data */
	onOpenRequest: (guest: string) => void;
	/** Open the reserved booking's checklist */
	onOpenReserved: (guest: string) => void;
	/** A confirmed booking is a match — its row opens the match screen */
	onOpenMatch: () => void;
}) {
	const swap = useSwapState();
	// Melissa's and Aisha's statuses are live (the host acts on them);
	// the rest keep their static state.
	const statusOf = (r: TripBookingRequest) =>
		REQUEST_PREVIEWS[r.name] ? guestState(swap, r.name) : r.status;

	// Declined requests keep their history in a collapsed section — hosts
	// need the memory ("did I already decline them?"), not the noise.
	const active = TRIP_REQUESTS.filter((r) => statusOf(r) !== 'declined');
	const declined = TRIP_REQUESTS.filter((r) => statusOf(r) === 'declined');
	const [showDeclined, setShowDeclined] = useState(false);

	const renderRow = (r: TripBookingRequest) => {
		const status = statusOf(r);
		const onOpen =
			status === 'confirmed'
				? onOpenMatch
				: status === 'reserved'
					? () => onOpenReserved(r.name)
					: REQUEST_PREVIEWS[r.name] &&
						  (status === 'new' ||
								status === 'offered' ||
								status === 'revoked' ||
								status === 'declined')
						? () => onOpenRequest(r.name)
						: undefined;
		const partner = REQUEST_PREVIEWS[r.name]?.partner;
		return (
			<button
				key={r.id}
				className={`req-row${status === 'declined' || status === 'revoked' ? ' muted' : ''}`}
				onClick={onOpen}
			>
				{/* Lead + count: one clear face, a badge for the rest — the
				    same 44px slot whatever the group size */}
				{partner ? (
					<span className="lead-slot">
						<Avatar variant={r.avatar} initial={r.initial} size={44} />
						<span className="lead-count">+1</span>
					</span>
				) : (
					<Avatar variant={r.avatar} initial={r.initial} size={44} />
				)}
				<span className="tr-body">
					<span className="tr-title">
						{partner ? `${r.name} +1` : r.name}
					</span>
					<span className="tr-sub">{r.sub}</span>
				</span>
				{/* H4b: the status is its own right-aligned column, dot + text */}
				<span className={`row-stat ${ROW_STAT[status ?? 'new'][1]}`}>
					<span className="rs-dot" />
					{ROW_STAT[status ?? 'new'][0]}
				</span>
				{onOpen && <IconChevronRight size={18} />}
			</button>
		);
	};

	return (
		<div className="screen">
			<StatusBar time="12:13" />
			<div className="form-header review-head with-back">
				<button className="icon-btn review-back" onClick={onBack} aria-label="Back">
					<IconChevronLeft size={26} />
				</button>
				<span className="review-head-titles trip-head">
					<span className="review-head-title">26 - 29 Aug</span>
					<span className="trip-head-sub">3 nights @ £67/night</span>
				</span>
				<div className="away-actions horizontal trip-head-actions">
					<button className="away-action" aria-label="Edit trip">
						<IconPencil />
					</button>
					<button className="away-action" aria-label="Delete trip">
						<IconTrash />
					</button>
				</div>
			</div>

			<div className="screen-scroll" style={{ padding: '16px 20px 24px' }}>
				<div className="trips-section-head" style={{ marginTop: 4 }}>
					<h2 className="trips-section-title">
						Booking requests <span className="req-count">{active.length}</span>
					</h2>
				</div>

				{active.map(renderRow)}

				{declined.length > 0 && (
					<>
						<button
							className="declined-toggle"
							onClick={() => setShowDeclined((o) => !o)}
							aria-expanded={showDeclined}
						>
							Declined ({declined.length})
							<span className={`chev${showDeclined ? ' open' : ''}`}>
								<IconChevronDown size={17} />
							</span>
						</button>
						{showDeclined && declined.map(renderRow)}
					</>
				)}
			</div>
		</div>
	);
}
