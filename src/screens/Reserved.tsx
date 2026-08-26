/**
 * The one reserved booking for a trip: the stayer's completion checklist
 * (rental agreement, deposit, rent). Only one request can be in this state
 * at a time; when everything is done the host can confirm the booking.
 */
import React from 'react';

import { LISTINGS } from '../data';
import { IconCheck, IconChevronLeft, StatusBar } from '../ui';
import { setGuestState, setSwapState, useSwapState } from '../store';
import { GuestProfileCard, HostFlowSteps, REQUEST_PREVIEWS } from './HostRequest';

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
	const listing = LISTINGS.find((l) => l.listerName === 'Ryan')!;
	const rentTotal = preview.nights * listing.nightlyRate;
	const allDone = swap.hostSigned && swap.depositPaid && swap.rentPaid;

	// Payments are the stayer's steps really — tappable here so the state
	// change can be demoed from the host's phone.
	const PayState = ({ paid }: { paid: boolean }) =>
		paid ? (
			<span className="c-status">
				<Tick /> Paid
			</span>
		) : (
			<span className="c-status unpaid">
				<span className="hollow" aria-hidden /> Unpaid
			</span>
		);

	return (
		<div className="screen">
			<StatusBar time="12:13" />
			{/* The stepper is the heading — it names the stage and shows progress */}
			<div className="form-header review-head with-back">
				<button className="icon-btn review-back" onClick={onBack} aria-label="Back">
					<IconChevronLeft size={26} />
				</button>
				<HostFlowSteps current={2} />
				<span style={{ width: 44 }} />
			</div>

			<div className="form-content" style={{ paddingTop: 16 }}>
				<GuestProfileCard guest={guest} subtitle={preview.datesValue} />

				<p className="reserved-note">
					{guest}'s request is reserved. Once these steps are complete you
					can confirm the booking.
				</p>

				<div className="check-card">
					{/* Rental agreement — one row per signer */}
					<div className="check-item">
						<div className="check-title">Rental agreement</div>
						<div className="check-line split">
							<span className="c-left">{guest}</span>
							<span className="c-status">
								<Tick /> Signed
							</span>
						</div>
						<div className="check-line split">
							<span className="c-left">Ryan</span>
							{swap.hostSigned ? (
								<span className="c-status">
									<Tick /> Signed
								</span>
							) : (
								<button
									className="sign-btn"
									onClick={() => setSwapState({ hostSigned: true })}
								>
									Sign agreement
								</button>
							)}
						</div>
						<button className="view-agreement-btn">
							View rental agreement
						</button>
					</div>

					{/* Security deposit — tap to flip paid state (demo) */}
					<div className="check-item">
						<div className="check-title">Security deposit</div>
						<button
							className="check-line split tappable"
							onClick={() => setSwapState({ depositPaid: !swap.depositPaid })}
						>
							<span className="c-left">£{listing.securityDeposit}</span>
							<PayState paid={swap.depositPaid} />
						</button>
					</div>

					{/* Rent — tap to flip paid state (demo) */}
					<div className="check-item">
						<div className="check-title">Rent</div>
						<div className="check-note">
							You will receive rent 3 days after {guest} moves in
						</div>
						<button
							className="check-line split tappable"
							onClick={() => setSwapState({ rentPaid: !swap.rentPaid })}
						>
							<span className="c-left">£{rentTotal}</span>
							<PayState paid={swap.rentPaid} />
						</button>
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
