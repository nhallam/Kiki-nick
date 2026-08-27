/**
 * The one reserved booking for a trip: the stayer's completion checklist
 * (rental agreement, deposit, rent). Only one request can be in this state
 * at a time; when everything is done the host can confirm the booking.
 */
import React, { useState } from 'react';

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
	const allDone =
		swap.guestSigned && swap.hostSigned && swap.depositPaid && swap.rentPaid;
	const [showAgreement, setShowAgreement] = useState(false);

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
						{/* The stayer's signature is theirs to give — tappable here so
						    the state change can be demoed from the host's phone. */}
						<button
							className="check-line split tappable"
							onClick={() => setSwapState({ guestSigned: !swap.guestSigned })}
						>
							<span className="c-left">{guest}</span>
							{swap.guestSigned ? (
								<span className="c-status">
									<Tick /> Signed
								</span>
							) : (
								<span className="c-status unpaid">Waiting to be signed</span>
							)}
						</button>
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
						<button
							className="view-agreement-btn"
							onClick={() => setShowAgreement(true)}
						>
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

			{showAgreement && (
				<div className="sheet-overlay" onClick={() => setShowAgreement(false)}>
					<div
						className="agreement-modal"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="agreement-doc">
							<div className="agreement-heading">Short-stay Rental Agreement</div>
							<div className="agreement-ref">
								Kiki booking #KI-2026-0826 · Draft for signature
							</div>
							<p>
								This agreement is made between <b>Ryan Carter</b> ("the
								Host") of Ryan's Apartment, Hackney, London and{' '}
								<b>{preview.fullName}</b> ("the Stayer") of {preview.hometown}.
							</p>
							<div className="agreement-clause">
								<b>1. Stay.</b> The Host grants the Stayer use of the whole
								apartment from 26 August 2026 to 29 August 2026 (3 nights).
							</div>
							<div className="agreement-clause">
								<b>2. Payment.</b> Rent of £{rentTotal} and a refundable
								security deposit of £{listing.securityDeposit} are held by
								Kiki and released per the payment schedule.
							</div>
							<div className="agreement-clause">
								<b>3. Care of the home.</b> The Stayer agrees to treat the
								home with care, follow the house guide, and report any damage
								promptly.
							</div>
							<div className="agreement-clause">
								<b>4. Cancellation.</b> Cancellations follow Kiki's standard
								policy in force at the time of booking.
							</div>
							<div className="agreement-signatures">
								<div className="agreement-sig">
									<span className="sig-name">{guest}</span>
									<span className={swap.guestSigned ? 'sig-state done' : 'sig-state'}>
										{swap.guestSigned ? '✓ Signed' : 'Not yet signed'}
									</span>
								</div>
								<div className="agreement-sig">
									<span className="sig-name">Ryan</span>
									<span className={swap.hostSigned ? 'sig-state done' : 'sig-state'}>
										{swap.hostSigned ? '✓ Signed' : 'Not yet signed'}
									</span>
								</div>
							</div>
						</div>
						<button
							className="btn-primary"
							style={{ marginTop: 14 }}
							onClick={() => setShowAgreement(false)}
						>
							Close
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
