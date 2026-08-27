/**
 * Host's view of one trip: the trip dates up top, then every booking
 * request that has come in against those dates — newest first.
 */
import React from 'react';

import { Avatar, IconChevronLeft, IconChevronRight, StatusBar } from '../ui';
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

export const TRIP_REQUESTS: TripBookingRequest[] = [
	{
		id: 1,
		name: 'Melissa',
		avatar: 'melissa',
		sub: '1 guest · 26 - 29 Aug · £201 + deposit',
		status: 'new',
	},
	{
		id: 2,
		name: 'Aisha',
		avatar: 'aisha',
		initial: 'A',
		sub: '1 guest · 27 - 29 Aug · £134 + deposit',
		status: 'new',
	},
	{
		id: 3,
		name: 'Tash',
		avatar: 'tash',
		initial: 'T',
		sub: '2 guests · 26 - 29 Aug · £201 + deposit',
		status: 'declined',
	},
	{
		id: 4,
		name: 'Sara',
		avatar: 'sara',
		initial: 'S',
		sub: '1 guest · 26 - 28 Aug · £134 + deposit',
		status: 'declined',
	},
	{
		id: 5,
		name: 'Marco',
		avatar: 'marco',
		initial: 'M',
		sub: '2 guests · 26 - 29 Aug · £201 + deposit',
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
						Booking requests <span className="req-count">{TRIP_REQUESTS.length}</span>
					</h2>
				</div>

				{TRIP_REQUESTS.map((r) => {
					const status = statusOf(r);
					const onOpen =
						status === 'confirmed'
							? onOpenMatch
							: status === 'reserved'
								? () => onOpenReserved(r.name)
								: status === 'new' && REQUEST_PREVIEWS[r.name]
									? () => onOpenRequest(r.name)
									: undefined;
					return (
						<button key={r.id} className="req-row" onClick={onOpen}>
							<Avatar variant={r.avatar} initial={r.initial} size={44} />
							<span className="tr-body">
								<span className="tr-title">
									{r.name}
									{status === 'new' && <span className="new-badge">New</span>}
									{status === 'inReview' && (
										<span className="review-badge">In review</span>
									)}
									{status === 'reserved' && (
										<span className="review-badge">Reserved</span>
									)}
									{status === 'confirmed' && (
										<span className="confirmed-badge">Confirmed</span>
									)}
									{status === 'declined' && (
										<span className="declined-badge">Declined</span>
									)}
								</span>
								<span className="tr-sub">{r.sub}</span>
							</span>
							<IconChevronRight size={18} />
						</button>
					);
				})}
			</div>
		</div>
	);
}
