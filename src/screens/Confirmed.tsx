/**
 * Celebration screen after the host confirms a reserved booking — the
 * match is made, so celebrate the person who is coming to stay.
 * (The fan-out photo deck this screen used to show is archived in
 * PhotoDeck.tsx for the guest-side confirmation later.)
 */
import React from 'react';

import { Avatar, IconChevronLeft, IconPin, StatusBar } from '../ui';
import { HostFlowSteps, REQUEST_PREVIEWS } from './HostRequest';

export function ConfirmedScreen({
	guest,
	onBack,
	onDone,
}: {
	guest: string;
	onBack: () => void;
	onDone: () => void;
}) {
	const preview = REQUEST_PREVIEWS[guest] ?? REQUEST_PREVIEWS.Melissa;

	return (
		<div className="screen">
			<StatusBar time="12:13" />
			{/* Same header chrome as the other two stages — back + stepper */}
			<div className="form-header review-head with-back">
				<button className="icon-btn review-back" onClick={onBack} aria-label="Back">
					<IconChevronLeft size={26} />
				</button>
				<HostFlowSteps current={3} complete />
				<span style={{ width: 44 }} />
			</div>

			<div className="confirmed-hero">
				<span className="guest-hero-avatar">
					<Avatar
						variant={preview.avatar}
						initial={preview.initial}
						size={132}
						flag={preview.flag}
					/>
				</span>
				<h1 className="confirmed-title">Awesome!</h1>
				<p className="confirmed-sub">
					{guest} will be staying in your place for {preview.nights} nights
					in August!
				</p>
				<span className="guest-hometown">
					<IconPin size={15} /> {preview.hometown}
				</span>
				<span className="stay-badge">
					This is her {preview.stayOrdinal} stay in a Kiki!
				</span>
			</div>

			<div className="form-footer">
				<button className="btn-primary" onClick={onDone}>
					Back to Trips
				</button>
			</div>
		</div>
	);
}
