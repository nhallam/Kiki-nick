/**
 * Celebration screen after the host confirms a reserved booking — the
 * match is made, so celebrate the person who is coming to stay.
 * (The fan-out photo deck this screen used to show is archived in
 * PhotoDeck.tsx for the guest-side confirmation later.)
 */
import React from 'react';

import { Avatar, IconChevronLeft, StatusBar } from '../ui';
import { Confetti } from './Confetti';
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
	const who = preview.displayName ?? guest;

	return (
		<div className="screen">
			<Confetti />
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
				{preview.partner ? (
					/* Group booking: both stayers share the spotlight */
					<span className="pair-avatars hero">
						<span className="guest-hero-avatar">
							<Avatar
								variant={preview.avatar}
								initial={preview.initial}
								size={104}
								flag={preview.flag}
							/>
						</span>
						<span className="guest-hero-avatar">
							<Avatar
								variant={preview.partner.avatar}
								initial={preview.partner.initial}
								size={104}
							/>
						</span>
					</span>
				) : (
					<span className="guest-hero-avatar">
						<Avatar
							variant={preview.avatar}
							initial={preview.initial}
							size={132}
							flag={preview.flag}
						/>
					</span>
				)}
				<h1 className="confirmed-title">Your match is confirmed!</h1>
				<p className="confirmed-sub">
					{who} will be staying in your place for {preview.nights} nights{' '}
					{preview.stayWhen ?? 'in August'}!
				</p>
			</div>

			<div className="form-footer">
				<button className="btn-primary" onClick={onDone}>
					View your match
				</button>
			</div>
		</div>
	);
}
