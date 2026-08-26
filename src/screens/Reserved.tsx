/**
 * The one reserved booking for a trip: the stayer's completion checklist
 * (rental agreement, deposit, rent). Only one request can be in this state
 * at a time; when everything is done the host can confirm the booking.
 */
import React from 'react';

import { IconCheck, IconChevronLeft, StatusBar } from '../ui';
import { setGuestState, setSwapState, useSwapState } from '../store';
import { GuestProfileCard, REQUEST_PREVIEWS } from './HostRequest';

const Tick = () => (
	<span className="tick" aria-hidden>
		<IconCheck size={11} />
	</span>
);

export function ReservedScreen({
	guest,
	onBack,
	onConfirmed,
}: {
	guest: string;
	onBack: () => void;
	onConfirmed: () => void;
}) {
	const swap = useSwapState();
	const preview = REQUEST_PREVIEWS[guest] ?? REQUEST_PREVIEWS.Melissa;
	const allDone = swap.hostSigned; // the guest's own steps are already done

	return (
		<div className="screen">
			<StatusBar time="12:13" />
			<div className="form-header review-head with-back">
				<button className="icon-btn review-back" onClick={onBack} aria-label="Back">
					<IconChevronLeft size={26} />
				</button>
				<span className="review-head-titles">
					<span className="review-head-title">Reserved</span>
				</span>
				<span style={{ width: 44 }} />
			</div>

			<div className="form-content" style={{ paddingTop: 16 }}>
				<GuestProfileCard guest={guest} subtitle={preview.datesValue} />

				<p className="reserved-note">
					{guest}'s request is reserved. Once these steps are complete you
					can confirm the booking.
				</p>

				<div className="check-card">
					{/* Rental agreement — both parties have to sign */}
					<div className="check-item">
						<div className="check-title">Rental agreement</div>
						<div className="check-line done">
							<Tick /> {guest} has signed
						</div>
						{swap.hostSigned ? (
							<div className="check-line done">
								<Tick /> You have signed
							</div>
						) : (
							<div className="check-line pending-line">
								<span>You haven't signed yet</span>
								<button
									className="sign-btn"
									onClick={() => setSwapState({ hostSigned: true })}
								>
									Sign agreement
								</button>
							</div>
						)}
					</div>

					{/* Security deposit — binary */}
					<div className="check-item">
						<div className="check-title">Security deposit</div>
						<div className="check-line done">
							<Tick /> Paid
						</div>
					</div>

					{/* Rent — binary */}
					<div className="check-item">
						<div className="check-title">Rent</div>
						<div className="check-line done">
							<Tick /> Paid
						</div>
					</div>
				</div>
			</div>

			<div className="form-footer">
				<button
					className="btn-primary"
					disabled={!allDone}
					onClick={() => {
						setGuestState(guest, 'confirmed');
						onConfirmed();
					}}
				>
					Confirm Request
				</button>
			</div>
		</div>
	);
}
