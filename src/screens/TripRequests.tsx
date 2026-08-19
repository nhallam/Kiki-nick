/**
 * Host's view of one trip: the trip dates up top, then every booking
 * request that has come in against those dates — newest first.
 */
import React from 'react';

import { Avatar, IconChevronLeft, IconChevronRight, StatusBar } from '../ui';

interface TripBookingRequest {
	id: number;
	name: string;
	avatar: string;
	initial?: string;
	sub: string;
	isNew?: boolean;
}

const TRIP_REQUESTS: TripBookingRequest[] = [
	{
		id: 1,
		name: 'Melissa',
		avatar: 'melissa',
		sub: 'Individual · 26 - 29 Aug · £201 + deposit',
		isNew: true,
	},
	{
		id: 2,
		name: 'Tash',
		avatar: 'tash',
		initial: 'T',
		sub: 'Couple · 26 - 29 Aug · £201 + deposit',
	},
	{
		id: 3,
		name: 'Sara',
		avatar: 'sara',
		initial: 'S',
		sub: 'Individual · 26 - 28 Aug · £134 + deposit',
	},
];

export function TripRequestsScreen({
	onBack,
	onOpenRequest,
}: {
	onBack: () => void;
	/** Only Melissa's request has a detail screen in this prototype */
	onOpenRequest: () => void;
}) {
	return (
		<div className="screen">
			<StatusBar time="12:13" />
			<div className="form-header review-head with-back">
				<button className="icon-btn review-back" onClick={onBack} aria-label="Back">
					<IconChevronLeft size={26} />
				</button>
				<span className="review-head-titles">
					<span className="review-head-title">Trip</span>
				</span>
				<span style={{ width: 44 }} />
			</div>

			<div className="screen-scroll" style={{ padding: '16px 20px 24px' }}>
				<div className="trip-hero">
					<div className="away-thumb">✈️</div>
					<div className="away-body">
						<div className="trip-hero-dates">26 - 29 Aug</div>
						<div className="away-meta">3 nights @ £67/night</div>
					</div>
				</div>

				<div className="trips-section-head" style={{ marginTop: 22 }}>
					<h2 className="trips-section-title">
						Booking requests <span className="req-count">3</span>
					</h2>
				</div>

				{TRIP_REQUESTS.map((r) => (
					<button
						key={r.id}
						className={`req-row${r.isNew ? ' new' : ''}`}
						onClick={r.isNew ? onOpenRequest : undefined}
					>
						<Avatar variant={r.avatar} initial={r.initial} size={44} />
						<span className="tr-body">
							<span className="tr-title">
								{r.name}
								{r.isNew && <span className="new-badge">New</span>}
							</span>
							<span className="tr-sub">{r.sub}</span>
						</span>
						<IconChevronRight size={18} />
					</button>
				))}
			</div>
		</div>
	);
}
