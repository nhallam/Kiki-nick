/**
 * Kiki Trips → "Sent requests" tab, plus the post-submit success bottom sheet
 * (port of BookingRequestSuccessSheet, shown over this list keyed off `nbr`).
 */
import React from 'react';

import { SentRequest } from '../data';
import {
	IconCalendar,
	IconCheck,
	IconPeople,
	IconReorderArrows,
	IconSend,
	RoomPhoto,
	StatusBar,
} from '../ui';
import { TripRequestCard } from './Rank';
import { TabBar } from './TabBar';

export function TripsScreen({
	requests,
	showSuccessSheet,
	successListerName,
	successPhotoVariant,
	onDismissSuccess,
	onReorder,
}: {
	requests: SentRequest[];
	showSuccessSheet: boolean;
	successListerName: string;
	successPhotoVariant: string;
	onDismissSuccess: () => void;
	onReorder?: () => void;
}) {
	return (
		<div className="screen">
			<StatusBar time="12:13" />
			<div className="trips-header">
				<div className="trips-title">Kiki Trips</div>
				<div className="trips-tabs">
					<span className="trips-tab">
						<IconCalendar size={19} /> Dates away
					</span>
					<span className="trips-tab">
						<IconPeople size={19} /> Matches
					</span>
					<span className="trips-tab active">
						<IconSend size={19} /> Sent requests
					</span>
				</div>
			</div>

			<div className="screen-scroll">
				<button className="reorder-btn" onClick={onReorder}>
					<IconReorderArrows size={22} /> Reorder
				</button>
				<div
					className="rank-list"
					style={{ padding: '0 20px 24px' }}
				>
					{requests.map((r, index) => (
						<div key={r.id} className="rank-row">
							<span className={`rank-num${index === 0 ? ' top' : ''}`}>
								#{index + 1}
							</span>
							<TripRequestCard request={r} />
						</div>
					))}
				</div>
			</div>

			<TabBar active="trips" notificationCount={1} />

			{showSuccessSheet && (
				<div className="sheet-overlay" onClick={onDismissSuccess}>
					<div className="sheet" onClick={(e) => e.stopPropagation()}>
						<div className="photo">
							<RoomPhoto variant={successPhotoVariant} />
						</div>
						<div className="body">
							<div className="title-row">
								<span className="check-badge">
									<IconCheck size={15} />
								</span>
								<span className="title">
									Booking request sent to {successListerName}
								</span>
							</div>
							<span className="subtitle">
								We'll let you know when they respond!
							</span>
							<button className="btn-primary" onClick={onDismissSuccess}>
								Can't wait!
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
