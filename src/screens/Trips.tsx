/**
 * Trips, split by which side of the swap you're on: Staying (the requests
 * you've sent for other people's places) and Hosting (your matches and the
 * dates your own place is free).
 */
import React, { useState } from 'react';

import { SentRequest } from '../data';
import { Avatar, IconAddCircle, StatusBar } from '../ui';
import { guestState, useSwapState } from '../store';
import { TripRequestCard } from './Rank';
import { TabBar } from './TabBar';
import { TRIP_REQUESTS } from './TripRequests';

type TripsTab = 'staying' | 'hosting';

interface AwayTrip {
	id: number;
	nights: number;
	nightlyRate: number;
	dates: string;
	/** Unseen (New) booking requests against these dates */
	newRequests?: number;
}

/* Ryan's trips: the same windows as his listing's Available Dates. The
   Aug trip's New count is computed live in TripsScreen — the host acting
   on requests moves them out of New. */
const UPCOMING_TRIPS: AwayTrip[] = [
	{ id: 1, nights: 3, nightlyRate: 67, dates: '26 - 29 Aug' },
	{ id: 4, nights: 7, nightlyRate: 67, dates: '12 - 19 Sep' },
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

function AwayTripCard({
	trip,
	onOpenTrip,
}: {
	trip: AwayTrip;
	onOpenTrip?: () => void;
}) {
	return (
		<div
			className={`away-card${onOpenTrip ? ' clickable' : ''}`}
			onClick={onOpenTrip}
			role={onOpenTrip ? 'button' : undefined}
			tabIndex={onOpenTrip ? 0 : undefined}
		>
			<div className="away-main">
				<div className="away-thumb">✈️</div>
				<div className="away-body">
					<div className="away-title">
						Trip
						{trip.newRequests != null && trip.newRequests > 0 && (
							<span className="count-badge">{trip.newRequests}</span>
						)}
					</div>
					<div className="away-meta">
						{trip.nights} nights @ £{trip.nightlyRate}/night
					</div>
					<div className="away-meta">{trip.dates}</div>
				</div>
				<div className="away-actions">
					<button
						className="away-action"
						aria-label="Edit trip"
						onClick={(e) => e.stopPropagation()}
					>
						<IconPencil />
					</button>
					<button
						className="away-action"
						aria-label="Delete trip"
						onClick={(e) => e.stopPropagation()}
					>
						<IconTrash />
					</button>
				</div>
			</div>
		</div>
	);
}

export function TripsScreen({
	requests,
	onReorder,
	initialTab,
	canHost,
	onNavigate,
	onOpenTrip,
	onOpenRequestListing,
}: {
	requests: SentRequest[];
	onReorder?: () => void;
	initialTab?: TripsTab;
	/** Without a listing there is nothing to host — the tab sells listing. */
	canHost?: boolean;
	onNavigate?: (tab: 'explore' | 'trips') => void;
	/** Open a trip's detail (dates + its booking requests) */
	onOpenTrip?: () => void;
	/** Open the listing a sent request points at */
	onOpenRequestListing?: (listingId: number) => void;
}) {
	const [tab, setTab] = useState<TripsTab>(initialTab ?? 'staying');

	const swap = useSwapState();
	// Requests still New for the Aug trip (Tash/Sara/Marco are settled).
	const newCount = TRIP_REQUESTS.filter(
		(r) => guestState(swap, r.name) === 'new' && (r.name === 'Melissa' || r.name === 'Aisha'),
	).length;
	const matched = swap.melissa === 'confirmed';

	// Melissa's own phone: her request card tracks what Ryan does with it.
	const stayingStatus = (r: SentRequest): string => {
		if (r.listingId !== 2) return r.status;
		if (swap.melissa === 'reserved') return 'Reserved - complete your steps';
		if (swap.melissa === 'confirmed') return 'Confirmed';
		if (swap.melissa === 'declined') return 'Declined';
		return r.status;
	};

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
						{canHost && newCount > 0 && (
							<span className="count-badge">{newCount}</span>
						)}
					</button>
				</div>
			</div>

			<div className="screen-scroll">
				{tab === 'staying' && (
					<div className="trips-pane">
						<div className="trips-section">
							<div className="trips-section-head">
								<h2 className="trips-section-title">Matches</h2>
							</div>
							{matched ? (
								<div className="req-row match">
									<Avatar variant="ryan" size={44} flag="🇳🇿" />
									<span className="tr-body">
										<span className="tr-title">
											Ryan's Apartment
											<span className="confirmed-badge">Confirmed</span>
										</span>
										<span className="tr-sub">26 - 29 Aug · 3 nights · Hackney, London</span>
									</span>
								</div>
							) : (
								<div className="empty-card">
									<div className="empty-title">You don't have any matches yet.</div>
									<div className="empty-sub">
										When you have a match, you'll be able to see it here.
									</div>
								</div>
							)}
						</div>

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
											<TripRequestCard
												request={{ ...r, status: stayingStatus(r) }}
												onOpen={
													r.listingId && onOpenRequestListing
														? () => onOpenRequestListing(r.listingId!)
														: undefined
												}
											/>
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

				{tab === 'hosting' && !canHost && (
					<div className="trips-pane centered">
						<div className="empty-card hosting-cta">
							<div className="empty-title">
								Going away? List your home or room.
							</div>
							<button className="btn-primary">Get started</button>
						</div>
					</div>
				)}

				{tab === 'hosting' && canHost && (
					<div className="trips-pane">
						<div className="trips-section">
							<div className="trips-section-head">
								<h2 className="trips-section-title">Matches</h2>
							</div>
							{matched ? (
								<div className="req-row match">
									<Avatar variant="melissa" size={44} flag="🇦🇺" />
									<span className="tr-body">
										<span className="tr-title">
											Melissa
											<span className="confirmed-badge">Confirmed</span>
										</span>
										<span className="tr-sub">26 - 29 Aug · 3 nights · £201 + deposit</span>
									</span>
								</div>
							) : (
								<div className="empty-card">
									<div className="empty-title">You don't have any matches yet.</div>
									<div className="empty-sub">
										When you have a match, you'll be able to see it here.
									</div>
								</div>
							)}
						</div>

						<div className="trips-section">
							<div className="trips-section-head">
								<h2 className="trips-section-title">Available dates</h2>
								<button className="trips-section-add">
									<IconAddCircle size={16} /> Add a new trip
								</button>
							</div>
							{UPCOMING_TRIPS.map((t) => (
								<AwayTripCard
									key={t.id}
									trip={
										t.id === 1 ? { ...t, newRequests: newCount } : t
									}
									onOpenTrip={t.id === 1 ? onOpenTrip : undefined}
								/>
							))}
							<div className="trips-subsection-title">Past trips</div>
							{PAST_TRIPS.map((t) => (
								<AwayTripCard key={t.id} trip={t} />
							))}
						</div>
					</div>
				)}
			</div>

			<TabBar active="trips" notificationCount={1} onNavigate={onNavigate} />
		</div>
	);
}
