/**
 * The reserved booking's completion checklist (rental agreement, deposit,
 * rent), inside the 48-hour window. Only one request can hold overlapping
 * dates; the booking confirms itself once all three steps are done, and
 * either party can withdraw until both signatures are in.
 */
import React, { useEffect, useState } from 'react';

import { LISTINGS } from '../data';
import { IconCheck, IconChevronLeft, StatusBar } from '../ui';
import {
	guestState,
	setGuestState,
	setSwapState,
	useSwapState,
	withdrawReservation,
} from '../store';
import { HostFlowSteps, REQUEST_PREVIEWS } from './HostRequest';
import { ReserveTimer } from './ReserveTimer';

const Tick = () => (
	<span className="tick" aria-hidden>
		<IconCheck size={11} />
	</span>
);

/** The placeholder rental agreement document — shared by both phones. */
export function AgreementModal({
	guest,
	onClose,
}: {
	guest: string;
	onClose: () => void;
}) {
	const swap = useSwapState();
	const preview = REQUEST_PREVIEWS[guest] ?? REQUEST_PREVIEWS.Melissa;
	const listing = LISTINGS.find((l) => l.listerName === 'Ryan')!;
	const rentTotal = preview.nights * listing.nightlyRate;

	return (
		<div className="sheet-overlay" onClick={onClose}>
			<div className="agreement-modal" onClick={(e) => e.stopPropagation()}>
				<div className="agreement-doc">
					<div className="agreement-heading">Short-stay Rental Agreement</div>
					<div className="agreement-ref">
						Kiki booking #KI-2026-0826 · Draft for signature
					</div>
					<p>
						This agreement is made between <b>Ryan Carter</b> ("the Host") of
						Ryan's Apartment, Hackney, London and <b>{preview.fullName}</b>{' '}
						("the Stayer") of {preview.hometown}.
					</p>
					<div className="agreement-clause">
						<b>1. Stay.</b> The Host grants the Stayer use of the whole
						apartment from 26 August 2026 to 29 August 2026 (3 nights).
					</div>
					<div className="agreement-clause">
						<b>2. Payment.</b> Rent of £{rentTotal} and a refundable security
						deposit of £{listing.securityDeposit} are held by Kiki and released
						per the payment schedule.
					</div>
					<div className="agreement-clause">
						<b>3. Care of the home.</b> The Stayer agrees to treat the home
						with care, follow the house guide, and report any damage promptly.
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
				<button className="btn-primary" style={{ marginTop: 14 }} onClick={onClose}>
					Close
				</button>
			</div>
		</div>
	);
}

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
	const who = preview.displayName ?? guest;
	// The 3 steps: agreement (both signatures), deposit, rent
	const stepsDone =
		(swap.guestSigned && swap.hostSigned ? 1 : 0) +
		(swap.depositPaid ? 1 : 0) +
		(swap.rentPaid ? 1 : 0);
	const allDone = stepsDone === 3;
	const bothSigned = swap.guestSigned && swap.hostSigned;
	const state = guestState(swap, guest);
	const [showAgreement, setShowAgreement] = useState(false);
	const [confirmWithdraw, setConfirmWithdraw] = useState(false);

	// No manual Confirm any more: 3 of 3 confirms the booking by itself.
	useEffect(() => {
		if (state === 'reserved' && allDone) {
			const t = window.setTimeout(() => setGuestState(guest, 'confirmed'), 700);
			return () => window.clearTimeout(t);
		}
	}, [state, allDone, guest]);
	useEffect(() => {
		if (state === 'confirmed') onConfirmed();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state]);

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
			<div className="form-header review-head with-back no-rule">
				<button className="icon-btn review-back" onClick={onBack} aria-label="Back">
					<IconChevronLeft size={26} />
				</button>
				<HostFlowSteps current={2} />
				<span style={{ width: 44 }} />
			</div>

			<div className="form-content" style={{ paddingTop: 0 }}>
				<ReserveTimer note="to complete the steps" />

				{/* Flat like the request screen: no card chrome, dividers only.
				    No guest header — the checklist is about the steps, and the
				    guest's details live on the request and match screens. */}
				<div className="check-card flat">
					{/* Rental agreement — one row per signer */}
					<div className="check-item">
						<div className="check-title">Rental agreement</div>
						{/* The stayer's signature is theirs to give — tappable here so
						    the state change can be demoed from the host's phone. */}
						<button
							className="check-line split tappable"
							onClick={() => setSwapState({ guestSigned: !swap.guestSigned })}
						>
							<span className="c-left">{who}</span>
							{swap.guestSigned ? (
								<span className="c-status">
									<Tick /> Signed
								</span>
							) : (
								<span className="c-status unpaid">Waiting to be signed</span>
							)}
						</button>
						<div className="check-line split">
							{/* The host's own row on his own phone — "You", like Melissa's */}
						<span className="c-left">You</span>
							{swap.hostSigned ? (
								<span className="c-status">
									<Tick /> Signed
								</span>
							) : (
								<button
									className="sign-btn"
									onClick={() => setSwapState({ hostSigned: true })}
								>
									Tap to sign agreement
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

					{/* Both payments under one header — tap a row to flip its
					    paid state (demo) */}
					<div className="check-item">
						<div className="check-title">Payments</div>
						<button
							className="check-line split tappable"
							onClick={() => setSwapState({ depositPaid: !swap.depositPaid })}
						>
							<span className="c-left">
								Security deposit <span className="c-amount">£{listing.securityDeposit}</span>
							</span>
							<PayState paid={swap.depositPaid} />
						</button>
						<button
							className="check-line split tappable"
							onClick={() => setSwapState({ rentPaid: !swap.rentPaid })}
						>
							<span className="c-left">
								Rent <span className="c-amount">£{rentTotal}</span>
							</span>
							<PayState paid={swap.rentPaid} />
						</button>
						<div className="check-note">
							You will receive the rent 3 days after {who} moves in.
						</div>
					</div>
				</div>
			</div>

			<div className="form-footer">
				<div className="steps-progress">
					<span className="sp-count">{stepsDone} of 3 steps complete</span>
					<span className="sp-note">
						{allDone
							? 'Confirming the booking…'
							: 'The booking confirms automatically once all steps are done.'}
					</span>
				</div>
				{bothSigned ? (
					<div className="withdraw-locked">
						Both parties have signed — the reservation can no longer be
						withdrawn.
					</div>
				) : (
					<button
						className="withdraw-btn"
						onClick={() => setConfirmWithdraw(true)}
					>
						Withdraw reservation
					</button>
				)}
			</div>

			{showAgreement && (
				<AgreementModal guest={guest} onClose={() => setShowAgreement(false)} />
			)}

			{confirmWithdraw && (
				<div className="sheet-overlay" onClick={() => setConfirmWithdraw(false)}>
					<div className="dialog-card" onClick={(e) => e.stopPropagation()}>
						<div className="dialog-title">Withdraw this reservation?</div>
						<div className="dialog-sub">
							{who}'s request returns to your inbox and they'll be
							notified. Anything already signed or paid is undone.
						</div>
						<div className="dialog-actions">
							<button
								className="btn-dialog-cancel"
								onClick={() => setConfirmWithdraw(false)}
							>
								Cancel
							</button>
							<button
								className="btn-dialog-danger"
								onClick={() => {
									withdrawReservation(guest);
									onBack();
								}}
							>
								Withdraw
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
