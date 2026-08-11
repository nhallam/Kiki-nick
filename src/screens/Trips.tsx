/**
 * Trips, split by which side of the swap you're on: Staying (the requests
 * you've sent for other people's places) and Hosting (your matches and the
 * dates your own place is free).
 */
import React, { useState } from 'react';

import { SentRequest } from '../data';
import { IconAddCircle, StatusBar } from '../ui';
import { TripRequestCard } from './Rank';
import { TabBar } from './TabBar';

type TripsTab = 'staying' | 'hosting';

interface AwayTrip {
	id: number;
	nights: number;
	nightlyRate: number;
	dates: string;
	pending?: boolean;
}

const UPCOMING_TRIPS: AwayTrip[] = [
	{ id: 1, nights: 3, nightlyRate: 67, dates: '26 - 29 Aug', pending: true },
];

const PAST_TRIPS: AwayTrip[] = [
	{ id: 2, nights: 10, nightlyRate: 66, dates: '20 - 30 Jul' },
	{ id: 3, nights: 13, nightlyRate: 45, dates: '09 - 22 Aug' },
];

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

function AwayTripCard({ trip }: { trip: AwayTrip }) {
	return (
		<div className="away-card">
			<div className="away-thumb">✈️</div>
			<div className="away-body">
				<div className="away-title">Trip</div>
				<div className="away-meta">
					{trip.nights} nights @ £{trip.nightlyRate}/night
				</div>
				<div className="away-meta">{trip.dates}</div>
			</div>
			{trip.pending && <span className="away-pending">Pending</span>}
			<div className="away-actions">
				<button className="away-action" aria-label="Edit trip">
					<IconPencil />
				</button>
				<button className="away-action" aria-label="Delete trip">
					<IconTrash />
				</button>
			</div>
		</div>
	);
}

export function TripsScreen({
	requests,
	onReorder,
}: {
	requests: SentRequest[];
	onReorder?: () => void;
}) {
	const [tab, setTab] = useState<TripsTab>('staying');

	return (
		<div className="screen">
			<StatusBar time="12:13" />
			<div className="trips-header">
				<div className="trips-title">Trips</div>
				<div className="trips-tabs">
					<button
						className={`trips-tab${tab === 'staying' ? ' active' : ''}`}
						onClick={() => setTab('staying')}
					>
						Staying
					</button>
					<button
						className={`trips-tab${tab === 'hosting' ? ' active' : ''}`}
						onClick={() => setTab('hosting')}
					>
						Hosting
					</button>
				</div>
			</div>

			<div className="screen-scroll">
				{tab === 'staying' && (
					<div className="trips-pane">
						<div className="trips-section">
							<div className="trips-section-head">
								<h2 className="trips-section-title">Booking requests</h2>
								{onReorder && (
									<button className="trips-section-action" onClick={onReorder}>
										Reorder
									</button>
								)}
							</div>
							{requests.length > 0 ? (
								<div className="rank-list">
									{requests.map((r) => (
										<div key={r.id} className="rank-row">
											<TripRequestCard request={r} />
										</div>
									))}
								</div>
							) : (
								<div className="empty-card">
									<div className="empty-title">No booking requests yet.</div>
									<div className="empty-sub">
										Requests you send to hosts will show up here.
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{tab === 'hosting' && (
					<div className="trips-pane">
						<div className="trips-section">
							<div className="trips-section-head">
								<h2 className="trips-section-title">Matches</h2>
							</div>
							<div className="empty-card">
								<div className="empty-title">You don't have any matches yet.</div>
								<div className="empty-sub">
									When you have a match, you'll be able to see it here.
								</div>
							</div>
						</div>

						<div className="trips-section">
							<div className="trips-section-head">
								<h2 className="trips-section-title">Available dates</h2>
								<button className="trips-section-add">
									<IconAddCircle size={16} /> Add a new trip
								</button>
							</div>
							{UPCOMING_TRIPS.map((t) => (
								<AwayTripCard key={t.id} trip={t} />
							))}
							<div className="trips-subsection-title">Past trips</div>
							{PAST_TRIPS.map((t) => (
								<AwayTripCard key={t.id} trip={t} />
							))}
						</div>
					</div>
				)}
			</div>

			<TabBar active="trips" notificationCount={1} />
		</div>
	);
}
