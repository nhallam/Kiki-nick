import React from 'react';

import { IconCheck, StatusBar } from '../ui';

/**
 * Full-screen confirmation after sending a request — replaces the old
 * photo + sheet combo. One check, one line, one button.
 */
export function SentScreen({
	listerName,
	onDone,
}: {
	listerName: string;
	onDone: () => void;
}) {
	return (
		<div className="screen">
			<StatusBar />
			<div className="sent-body">
				<div className="sent-check">
					<IconCheck size={40} />
				</div>
				<div className="sent-title">Request sent</div>
				<p className="sent-sub">
					{listerName} has your request. We'll let you know as soon as they
					respond.
				</p>
			</div>
			<div className="form-footer" style={{ borderTop: 'none' }}>
				<button className="btn-primary" onClick={onDone}>
					Done
				</button>
			</div>
		</div>
	);
}
