/**
 * Celebration screen after the host confirms a reserved booking — the
 * match is made and both phones' Matches sections now show it.
 */
import React from 'react';

import { Avatar, RoomPhoto, StatusBar } from '../ui';
import { REQUEST_PREVIEWS } from './HostRequest';

export function ConfirmedScreen({
	guest,
	onDone,
}: {
	guest: string;
	onDone: () => void;
}) {
	const preview = REQUEST_PREVIEWS[guest] ?? REQUEST_PREVIEWS.Melissa;

	return (
		<div className="screen">
			<StatusBar time="12:13" />

			<div className="confirmed-hero">
				<div className="confirmed-photo">
					<RoomPhoto variant="jake" />
					<span className="confirmed-avatar">
						<Avatar
							variant={preview.avatar}
							initial={preview.initial}
							size={64}
							flag={preview.flag}
						/>
					</span>
				</div>
				<h1 className="confirmed-title">Awesome!</h1>
				<p className="confirmed-sub">
					{guest} will be staying in your place for {preview.nights} nights
					in August!
				</p>
			</div>

			<div className="form-footer">
				<button className="btn-primary" onClick={onDone}>
					Back to Trips
				</button>
			</div>
		</div>
	);
}
