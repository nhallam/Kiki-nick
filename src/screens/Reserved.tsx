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

/** Little document illustration for the agreement tiles — a page with text
    lines and a signature rule; signing draws the squiggle and a check badge. */
function DocIllustration({ signed }: { signed: boolean }) {
	return (
		<span className={`doc-illo${signed ? ' signed' : ''}`} aria-hidden>
			<svg width="66" height="80" viewBox="0 0 66 80" fill="none">
				<rect
					x="1.5"
					y="1.5"
					width="63"
					height="77"
					rx="9"
					fill="#f4f5f7"
					stroke={signed ? 'var(--primary)' : '#ddd'}
					strokeWidth="1.5"
				/>
				<rect x="12" y="15" width="30" height="4" rx="2" fill="#d5dade" />
				<rect x="12" y="26" width="42" height="3.5" rx="1.75" fill="#e1e4e8" />
				<rect x="12" y="35" width="42" height="3.5" rx="1.75" fill="#e1e4e8" />
				<rect x="12" y="44" width="28" height="3.5" rx="1.75" fill="#e1e4e8" />
				<line
					x1="12"
					y1="66"
					x2="54"
					y2="66"
					stroke="#d3d7dc"
					strokeWidth="1.5"
					strokeDasharray="3 3"
				/>
				{signed && (
					<path
						d="M14 62 c4 -7 8 3 13 -4 s9 2 13 -5 s9 4 12 -2"
						stroke="var(--primary-dark)"
						strokeWidth="2"
						strokeLinecap="round"
					/>
				)}
			</svg>
			{signed && (
				<span className="doc-check">
					<IconCheck size={12} />
				</span>
			)}
		</span>
	);
}

const PayState = ({ paid }: { paid: boolean }) =>
	paid ? (
		<span className="c-status paid">Paid</span>
	) : (
		<span className="c-status unpaid">Unpaid</span>
	);

/** A payment drawn as a small cheque: the name written on it, a signature
    rule, and the amount in its box. Paying turns the border teal, draws the
    squiggle and stamps a check badge — same language as the agreement docs. */
function PayCheque({
	label,
	payer,
	amount,
	paid,
	onToggle,
}: {
	label: string;
	/** Who the money comes from — written under the title, like a cheque's drawer */
	payer: string;
	amount: number;
	paid: boolean;
	onToggle: () => void;
}) {
	return (
		<button className={`pay-cheque${paid ? ' paid' : ''}`} onClick={onToggle}>
			<span className="pc-main">
				<span className="pc-name">{label}</span>
				<span className="pc-payer">
					{payer}
					{paid && <span className="pc-signed">Signed</span>}
				</span>
			</span>
			<span className="pc-amount">£{amount}</span>
			<PayState paid={paid} />
			{paid && (
				<span className="doc-check">
					<IconCheck size={12} />
				</span>
			)}
		</button>
	);
}

/** The placeholder rental agreement document — shared by both phones.
    With signAs="host" the host reads and signs in here: a Sign button sits
    under the document, and (demo) tapping the guest's signature slot flips
    her signature. */
export function AgreementModal({
	guest,
	onClose,
	signAs,
}: {
	guest: string;
	onClose: () => void;
	signAs?: 'host';
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
						<div
							className="agreement-sig"
							onClick={
								signAs === 'host'
									? () => setSwapState({ guestSigned: !swap.guestSigned })
									: undefined
							}
						>
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
				{signAs === 'host' && !swap.hostSigned ? (
					<>
						<button
							className="btn-primary"
							style={{ marginTop: 14 }}
							onClick={() => setSwapState({ hostSigned: true })}
						>
							Sign agreement
						</button>
						<button className="agreement-close-link" onClick={onClose}>
							Close
						</button>
					</>
				) : (
					<button
						className="btn-primary"
						style={{ marginTop: 14 }}
						onClick={onClose}
					>
						Close
					</button>
				)}
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
				{/* Flat like the request screen: no card chrome, dividers only.
				    No guest header — the checklist is about the steps, and the
				    guest's details live on the request and match screens. */}
				<div className="check-card flat">
					{/* Rental agreement — one row per signer */}
					<div className="check-item">
						<div className="check-title">Rental agreement</div>
						{/* One document per signer, side by side. Tapping either one
						    opens the agreement itself — you read what you sign, and
						    the Sign button lives inside the document. */}
						<div className="agreement-docs">
							<button
								className="agree-doc"
								onClick={() => setShowAgreement(true)}
							>
								<DocIllustration signed={swap.guestSigned} />
								<span className="ad-name">{who}</span>
								{swap.guestSigned ? (
									<span className="ad-status signed">Signed</span>
								) : (
									<span className="ad-status">Waiting to be signed</span>
								)}
							</button>
							<button
								className="agree-doc"
								onClick={() => setShowAgreement(true)}
							>
								<DocIllustration signed={swap.hostSigned} />
								<span className="ad-name">You</span>
								{swap.hostSigned ? (
									<span className="ad-status signed">Signed</span>
								) : (
									<span className="ad-status action">Tap to sign</span>
								)}
							</button>
						</div>
					</div>

					{/* Both payments under one header, as cheques stacked
					    vertically — tap one to flip its paid state (demo) */}
					<div className="check-item">
						<div className="check-title">Payments</div>
						<div className="pay-cheques">
							<PayCheque
								label="Security deposit"
								payer={who}
								amount={listing.securityDeposit}
								paid={swap.depositPaid}
								onToggle={() =>
									setSwapState({ depositPaid: !swap.depositPaid })
								}
							/>
							<PayCheque
								label="Rent"
								payer={who}
								amount={rentTotal}
								paid={swap.rentPaid}
								onToggle={() => setSwapState({ rentPaid: !swap.rentPaid })}
							/>
						</div>
						<div className="check-note">
							You will receive the rent 3 days after {who} moves in.
						</div>
					</div>
				</div>

			</div>

			{/* The deadline runs edge to edge, pinned right above the buttons */}
			<ReserveTimer note="to complete the steps" full />

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
				<AgreementModal
					guest={guest}
					signAs="host"
					onClose={() => setShowAgreement(false)}
				/>
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
