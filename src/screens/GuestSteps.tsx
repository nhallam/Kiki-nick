/**
 * Melissa's side of a reserved booking: Ryan accepted her request, and now
 * she completes her steps — sign the rental agreement, then pay deposit and
 * rent by bank transfer and upload a screenshot of each confirmation (the
 * MVP flow). Everything syncs live to Ryan's Reserved checklist.
 *
 * When Ryan confirms, this same route becomes her celebration: the fan-out
 * photo deck of the place she's about to stay in.
 */
import React, { useEffect, useState } from 'react';

import { PAY_SHOTS, RYAN_PHOTOS } from '../assets';
import { LISTINGS } from '../data';
import {
	IconCheck,
	IconChevronLeft,
	IconChevronRight,
	RoomPhoto,
	StatusBar,
} from '../ui';
import {
	activeGuest,
	getSwapState,
	guestState,
	reserveGuest,
	setGuestState,
	setSwapState,
	useSwapState,
	withdrawReservation,
} from '../store';
import { HostFlowSteps, REQUEST_PREVIEWS } from './HostRequest';

const IconCopy = ({ size = 15 }: { size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<rect x="9" y="9" width="12" height="12" rx="2.5" />
		<path d="M5 15H4.5A2.5 2.5 0 0 1 2 12.5v-8A2.5 2.5 0 0 1 4.5 2h8A2.5 2.5 0 0 1 15 4.5V5" />
	</svg>
);

/* Kiki's UK account (placeholder details) for the bank-transfer path */
const BANK_DETAILS = [
	{ label: 'Bank', value: 'Barclays Bank UK' },
	{ label: 'Account name', value: 'Kiki Home Swaps Ltd' },
	{ label: 'Sort code', value: '20-41-12' },
	{ label: 'Account number', value: '55671234' },
	{ label: 'Reference', value: 'KI-2026-0826' },
];
import { PhotoDeck } from './PhotoDeck';
import { AgreementModal, DocIllustration, ScheduledCheque } from './Reserved';
import { ReserveTimer } from './ReserveTimer';

/* Melissa's camera roll: her two payment screenshots plus a couple of
   holiday snaps, so the picker feels like a real roll. */
const GUEST_ROLL = [PAY_SHOTS[0], PAY_SHOTS[1], RYAN_PHOTOS[3], RYAN_PHOTOS[2]];

export function GuestStepsScreen({
	onBack,
	onOpenMatch,
}: {
	onBack: () => void;
	onOpenMatch: () => void;
}) {
	const swap = useSwapState();
	// The left phone plays whichever guest Ryan reserved — Melissa's,
	// Aisha's, or Tash & Jordan's flow, so each scenario is demoable.
	const guest = activeGuest(swap);
	const guestStateNow = guestState(swap, guest);
	const preview = REQUEST_PREVIEWS[guest];
	const listing = LISTINGS.find((l) => l.listerName === 'Ryan')!;
	const rentTotal = preview.nights * listing.nightlyRate;

	const [showAgreement, setShowAgreement] = useState(false);
	const [confirmWithdraw, setConfirmWithdraw] = useState(false);
	// Which payment is being uploaded ('deposit' | 'rent'), plus selection
	const [uploadFor, setUploadFor] = useState<'deposit' | 'rent' | null>(null);
	const [picked, setPicked] = useState<number | null>(null);
	// Paying starts with a how-to-pay sheet: bank transfer (Kiki's details,
	// copyable) or Stripe (placeholder). After Done on the transfer details,
	// the cheque goes back to the plain upload-a-screenshot flow.
	const [payFor, setPayFor] = useState<'deposit' | 'rent' | null>(null);
	const [paySheetView, setPaySheetView] = useState<'method' | 'bank'>('method');
	const [bankSeen, setBankSeen] = useState({ deposit: false, rent: false });
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const copyDetail = (label: string, value: string) => {
		try {
			navigator.clipboard?.writeText(value);
		} catch {
			/* clipboard can be unavailable in embedded previews */
		}
		setCopiedField(label);
		window.setTimeout(() => setCopiedField(null), 1400);
	};
	// 3.4: her steps run as a guided flow — three screens sliding
	// horizontally (what's needed → sign → pay), then the overview.
	// null = overview; she starts in the flow while her steps are incomplete.
	const [wizPage, setWizPage] = useState<number | null>(() => {
		const s = getSwapState();
		return s.guestSigned && s.depositPaid && s.rentPaid ? null : 0;
	});

	// The 3 steps: agreement (both signatures), deposit, rent
	const stepsDone =
		(swap.guestSigned && swap.hostSigned ? 1 : 0) +
		(swap.depositPaid ? 1 : 0) +
		(swap.rentPaid ? 1 : 0);
	const bothSigned = swap.guestSigned && swap.hostSigned;

	// The match is made when both parties have pressed Confirm match.
	useEffect(() => {
		if (
			guestStateNow === 'reserved' &&
			swap.guestConfirmedMatch &&
			swap.hostConfirmedMatch
		) {
			const t = window.setTimeout(() => setGuestState(guest, 'confirmed'), 500);
			return () => window.clearTimeout(t);
		}
	}, [guestStateNow, swap.guestConfirmedMatch, swap.hostConfirmedMatch, guest]);

	const openUpload = (which: 'deposit' | 'rent') => {
		setPicked(which === 'deposit' ? swap.depositShot : swap.rentShot);
		setUploadFor(which);
	};
	/* First tap on an unpaid cheque asks how to pay; once the transfer
	   details have been seen (or it's already paid), taps go to the
	   screenshot picker directly. */
	const startPayment = (which: 'deposit' | 'rent') => {
		const paid =
			which === 'deposit' ? swap.depositShot != null : swap.rentShot != null;
		if (paid || bankSeen[which]) {
			openUpload(which);
			return;
		}
		setPaySheetView('method');
		setPayFor(which);
	};
	const saveUpload = () => {
		if (picked == null || !uploadFor) return;
		if (uploadFor === 'deposit') {
			setSwapState({ depositShot: picked, depositPaid: true });
		} else {
			setSwapState({ rentShot: picked, rentPaid: true });
		}
		setUploadFor(null);
	};

	// Ryan confirmed — this route turns into the celebration.
	if (guestStateNow === 'confirmed') {
		return (
			<div className="screen">
				<StatusBar time="12:13" />
				<div className="form-header review-head with-back">
					<button className="icon-btn review-back" onClick={onBack} aria-label="Back">
						<IconChevronLeft size={26} />
					</button>
					<HostFlowSteps current={3} complete />
					<span style={{ width: 44 }} />
				</div>
				<div className="confirmed-hero">
					<PhotoDeck />
					<h1 className="confirmed-title">You're booked!</h1>
					<p className="confirmed-sub">
						Ryan confirmed your stay — {preview.nights} nights at his place in
						Hackney, {preview.datesValue.split(' · ')[0].replace(' 2026', '')}.
					</p>
				</div>
				<div className="form-footer">
					<button className="btn-primary" onClick={onOpenMatch}>
						View your match
					</button>
				</div>
			</div>
		);
	}

	// Two-step consent: Ryan sent an offer — nothing is reserved until she
	// accepts, and her other requests stay live meanwhile.
	if (guestStateNow === 'offered') {
		return (
			<div className="screen">
				<StatusBar time="12:13" />
				<div className="form-header review-head with-back no-rule">
					<button
						className="icon-btn review-back"
						onClick={onBack}
						aria-label="Back"
					>
						<IconChevronLeft size={26} />
					</button>
					<HostFlowSteps current={1} />
					<span style={{ width: 44 }} />
				</div>
				<div className="form-content" style={{ paddingTop: 0 }}>
					<div className="guest-steps-listing">
						<span className="gsl-thumb">
							<RoomPhoto variant={listing.photoVariant} />
						</span>
						<span className="gsl-body">
							<span className="gsl-title">Ryan's Apartment</span>
							<span className="gsl-sub">
								{preview.datesValue.split(' · ')[0].replace(' 2026', '')} ·{' '}
								{preview.nights} nights · Hackney, London
							</span>
						</span>
					</div>

					<h2 className="offer-title">Ryan sent you an offer!</h2>
					<p className="offer-sub">
						Accepting reserves your stay and starts the booking steps —
						signing the agreement and paying within 48 hours. Your other
						requests stay active until you accept.
					</p>

					<div className="offer-summary">
						<div className="offer-row">
							<span>Rent ({preview.nights} nights)</span>
							<span>£{rentTotal}</span>
						</div>
						<div className="offer-row">
							<span>Security deposit</span>
							<span>£{listing.securityDeposit}</span>
						</div>
						<div className="offer-row total">
							<span>Total</span>
							<span>£{rentTotal + listing.securityDeposit}</span>
						</div>
					</div>
				</div>
				<div className="form-footer">
					<button
						className="btn-primary"
						onClick={() => reserveGuest(guest)}
					>
						Accept offer
					</button>
				</div>
			</div>
		);
	}

	/* Her cheques: same paper object as Ryan's, but tapping one opens the
	   screenshot picker — pay by transfer, upload the confirmation. Once
	   uploaded, the screenshot sits on the cheque (tap to swap it). */
	const PayCheque = ({
		which,
		label,
		amount,
		shot,
	}: {
		which: 'deposit' | 'rent';
		label: string;
		amount: number;
		shot: number | null;
	}) => {
		const paid = shot != null;
		return (
			<button
				className={`pay-cheque${paid ? ' paid' : ''}`}
				onClick={() => startPayment(which)}
			>
				<span className="pc-main">
					<span className="pc-name">{label}</span>
					<span className="pc-payer">You</span>
				</span>
				{paid && (
					<span className="tl-thumb pay-thumb">
						<img src={GUEST_ROLL[shot]} alt="" />
					</span>
				)}
				<span className="pc-amount">£{amount}</span>
				{paid ? (
					<span className="c-status paid">Paid</span>
				) : (
					<span className="c-status upload">
						{bankSeen[which] ? 'Upload' : 'Pay'}
					</span>
				)}
				{paid && (
					<span className="doc-check">
						<IconCheck size={12} />
					</span>
				)}
			</button>
		);
	};

	/* Split rent: only stays over 30 nights qualify, and it reads as a
	   quiet option under the cheque rather than a mode switch — monthly
	   payments, two for a stay this length. The deposit always pays in
	   full, and the choice locks once the first rent payment is uploaded.
	   Shared by the guided flow's payments screen and the overview. */
	const canSplit = preview.nights > 30;
	const rent1 = Math.ceil(rentTotal / 2);
	const rentCheques = (
		<>
			{swap.rentSplit ? (
				<>
					<PayCheque
						which="rent"
						label="Rent — month 1"
						amount={rent1}
						shot={swap.rentShot}
					/>
					<ScheduledCheque
						label="Rent — month 2"
						due={preview.splitDue ?? 'the start of month 2'}
						amount={rentTotal - rent1}
						paid={swap.rent2Paid}
						payer="You"
					/>
				</>
			) : (
				<PayCheque
					which="rent"
					label="Rent"
					amount={rentTotal}
					shot={swap.rentShot}
				/>
			)}
			{canSplit && swap.rentShot == null && (
				<button
					className="split-link"
					onClick={() => setSwapState({ rentSplit: !swap.rentSplit })}
				>
					{swap.rentSplit
						? 'Pay the rent in full instead'
						: 'Stays over 30 nights can split the rent into monthly payments'}
				</button>
			)}
		</>
	);

	return (
		<div className="screen">
			<StatusBar time="12:13" />
			<div className="form-header review-head with-back no-rule">
				<button
					className="icon-btn review-back"
					onClick={() =>
						wizPage != null && wizPage > 0
							? setWizPage(wizPage - 1)
							: onBack()
					}
					aria-label="Back"
				>
					<IconChevronLeft size={26} />
				</button>
				<HostFlowSteps current={2} />
				<span style={{ width: 44 }} />
			</div>

			{wizPage != null ? (
				<>
					{/* The guided flow: three screens sliding horizontally */}
					<div className="wizard-viewport">
						<div
							className="wizard-row"
							style={{ transform: `translateX(-${(wizPage * 100) / 3}%)` }}
						>
							{/* 1 — what's needed to continue */}
							<div className="wizard-panel">
								<div className="wz-center">
									<h2 className="wz-title">Your dates are reserved!</h2>
									<p className="wz-sub">
										Complete these steps within 48 hours to confirm your
										stay at Ryan's Apartment.
									</p>
									<div className="wz-list">
										<div className="wz-step">
											<span
												className={`wz-num${swap.guestSigned ? ' done' : ''}`}
											>
												{swap.guestSigned ? <IconCheck size={13} /> : '1'}
											</span>
											Sign the rental agreement
										</div>
										<div className="wz-step">
											<span
												className={`wz-num${swap.depositPaid ? ' done' : ''}`}
											>
												{swap.depositPaid ? <IconCheck size={13} /> : '2'}
											</span>
											Pay the security deposit
										</div>
										<div className="wz-step">
											<span
												className={`wz-num${swap.rentPaid ? ' done' : ''}`}
											>
												{swap.rentPaid ? <IconCheck size={13} /> : '3'}
											</span>
											Pay the rent
										</div>
									</div>
								</div>
							</div>

							{/* 2 — sign, documents centered */}
							<div className="wizard-panel">
								<div className="wz-center">
									<h2 className="wz-title">Sign the rental agreement</h2>
									<p className="wz-sub">Tap a document to read and sign.</p>
									<div className="agreement-docs wz-docs">
										<button
											className="agree-doc"
											onClick={() => setShowAgreement(true)}
										>
											<DocIllustration signed={swap.guestSigned} large />
											<span className="ad-name">You</span>
											{swap.guestSigned ? (
												<span className="ad-status signed">Signed</span>
											) : (
												<span className="ad-status action">Tap to sign</span>
											)}
										</button>
										<button
											className="agree-doc"
											onClick={() => setShowAgreement(true)}
										>
											<DocIllustration signed={swap.hostSigned} large />
											<span className="ad-name">Ryan</span>
											{swap.hostSigned ? (
												<span className="ad-status signed">Signed</span>
											) : (
												<span className="ad-status">
													Waiting to be signed
												</span>
											)}
										</button>
									</div>
								</div>
							</div>

							{/* 3 — pay, cheque per payment */}
							<div className="wizard-panel">
								<div className="wz-center">
									<h2 className="wz-title">Make the payments</h2>
									<p className="wz-sub">
										Pay by bank transfer to Kiki, then upload a screenshot
										of each confirmation.
									</p>
									<div className="pay-cheques">
										<PayCheque
											which="deposit"
											label="Security deposit"
											amount={listing.securityDeposit}
											shot={swap.depositShot}
										/>
										{rentCheques}
									</div>
									<p className="wz-fine">
										The deposit is refunded in full after your stay.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="form-footer">
						{/* Same progress lockup as the overview, so the guest can
						    see where they are mid-flow */}
						<div className="steps-lockup">
							<div className="steps-track" aria-hidden>
								{[0, 1, 2].map((i) => (
									<span
										key={i}
										className={i < stepsDone ? 'seg done' : 'seg'}
									/>
								))}
							</div>
							<div className="steps-row">
								<span className="sl-count">
									{stepsDone} of 3 steps complete
								</span>
								<ReserveTimer note="" inline />
							</div>
						</div>
						{wizPage === 0 && (
							<button className="btn-primary" onClick={() => setWizPage(1)}>
								Okay
							</button>
						)}
						{wizPage === 1 && (
							<button
								className="btn-primary"
								disabled={!swap.guestSigned}
								onClick={() => setWizPage(2)}
							>
								Next
							</button>
						)}
						{wizPage === 2 &&
							(stepsDone === 3 ? (
								swap.guestConfirmedMatch ? (
									<div className="confirm-waiting">
										You've confirmed — waiting for Ryan to confirm.
									</div>
								) : (
									<button
										className="btn-primary"
										onClick={() =>
											setSwapState({ guestConfirmedMatch: true })
										}
									>
										Confirm match
									</button>
								)
							) : (
								<button
									className="btn-primary"
									disabled={!(swap.depositPaid && swap.rentPaid)}
									onClick={() => setWizPage(null)}
								>
									Done
								</button>
							))}
					</div>
				</>
			) : (
				<>
			<div className="form-content" style={{ paddingTop: 0 }}>
				{/* The place this is all for */}
				<div className="guest-steps-listing">
					<span className="gsl-thumb">
						<RoomPhoto variant={listing.photoVariant} />
					</span>
					<span className="gsl-body">
						<span className="gsl-title">Ryan's Apartment</span>
						<span className="gsl-sub">
							{preview.datesValue.split(' · ')[0].replace(' 2026', '')} ·{' '}
							{preview.nights} nights · Hackney, London
						</span>
					</span>
				</div>

				<p className="reserved-note">
					Ryan reserved your dates — complete your steps below to confirm the
					booking.
				</p>

				<div className="check-card flat">
					{/* Rental agreement — same documents as Ryan's screen, from her
					    seat. Tapping either opens the agreement; she signs inside. */}
					<div className="check-item">
						<div className="check-title">Rental agreement</div>
						<div className="agreement-docs">
							<button
								className="agree-doc"
								onClick={() => setShowAgreement(true)}
							>
								<DocIllustration signed={swap.guestSigned} />
								<span className="ad-name">You</span>
								{swap.guestSigned ? (
									<span className="ad-status signed">Signed</span>
								) : (
									<span className="ad-status action">Tap to sign</span>
								)}
							</button>
							<button
								className="agree-doc"
								onClick={() => setShowAgreement(true)}
							>
								<DocIllustration signed={swap.hostSigned} />
								<span className="ad-name">Ryan</span>
								{swap.hostSigned ? (
									<span className="ad-status signed">Signed</span>
								) : (
									<span className="ad-status">Waiting to be signed</span>
								)}
							</button>
						</div>
					</div>

					{/* Payments: bank transfer + screenshot upload (MVP flow),
					    dressed as the same cheques Ryan sees */}
					<div className="check-item">
						<div className="check-title">Payments</div>
						<div className="check-note">
							Pay by bank transfer to Kiki, then upload a screenshot of each
							confirmation.
						</div>
						<div className="pay-cheques">
							<PayCheque
								which="deposit"
								label="Security deposit"
								amount={listing.securityDeposit}
								shot={swap.depositShot}
							/>
							{rentCheques}
						</div>
						<div className="check-note">
							The deposit is refunded in full after your stay.
						</div>
					</div>
				</div>
			</div>

			<div className="form-footer">
				{/* Same lockup as Ryan's screen: a segment per step, the count on
				    the left, the countdown on the right */}
				<div className="steps-lockup">
					<div className="steps-track" aria-hidden>
						{[0, 1, 2].map((i) => (
							<span key={i} className={i < stepsDone ? 'seg done' : 'seg'} />
						))}
					</div>
					<div className="steps-row">
						<span className="sl-count">
							{stepsDone === 3
								? 'All steps complete'
								: `${stepsDone} of 3 steps complete`}
						</span>
						<ReserveTimer note="" inline />
					</div>
				</div>
				{stepsDone === 3 ? (
					swap.guestConfirmedMatch ? (
						<div className="confirm-waiting">
							You've confirmed — waiting for Ryan to confirm.
						</div>
					) : (
						<button
							className="btn-primary"
							onClick={() => setSwapState({ guestConfirmedMatch: true })}
						>
							Confirm match
						</button>
					)
				) : bothSigned ? (
					<div className="withdraw-locked">
						Both parties have signed — the reservation can no longer be
						withdrawn.
					</div>
				) : (
					<button
						className="withdraw-btn"
						onClick={() => setConfirmWithdraw(true)}
					>
						Withdraw my request
					</button>
				)}
			</div>
				</>
			)}

			{showAgreement && (
				<AgreementModal
					guest={guest}
					signAs="guest"
					onClose={() => setShowAgreement(false)}
				/>
			)}

			{confirmWithdraw && (
				<div className="sheet-overlay" onClick={() => setConfirmWithdraw(false)}>
					<div className="dialog-card" onClick={(e) => e.stopPropagation()}>
						<div className="dialog-title">Withdraw your request?</div>
						<div className="dialog-sub">
							Your reservation is cancelled and Ryan will be notified.
							Anything already signed or paid is undone.
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

			{payFor && (
				<div className="sheet-overlay" onClick={() => setPayFor(null)}>
					<div className="pay-sheet" onClick={(e) => e.stopPropagation()}>
						{paySheetView === 'method' ? (
							<>
								<div className="ps-title">
									Pay the{' '}
									{payFor === 'deposit' ? 'security deposit' : 'rent'}
								</div>
								<div className="ps-sub">
									£
									{payFor === 'deposit'
										? listing.securityDeposit
										: swap.rentSplit
											? rent1
											: rentTotal}{' '}
									to Kiki — choose how to pay.
								</div>
								<button
									className="pay-opt"
									onClick={() => setPaySheetView('bank')}
								>
									<span className="po-body">
										<span className="po-name">Bank transfer</span>
										<span className="po-sub">
											Kiki's UK account — upload your confirmation after
										</span>
									</span>
									<IconChevronRight size={18} />
								</button>
								{/* Placeholder only — the Stripe flow isn't wired up */}
								<button className="pay-opt">
									<span className="po-body">
										<span className="po-name">Pay with Stripe</span>
										<span className="po-sub">
											Card or Apple Pay · opens Stripe checkout
										</span>
									</span>
									<IconChevronRight size={18} />
								</button>
							</>
						) : (
							<>
								<div className="ps-title">Bank transfer details</div>
								<div className="ps-sub">
									Include the reference so Kiki can match your payment.
								</div>
								<div className="bank-rows">
									{BANK_DETAILS.map((d) => (
										<div className="bank-row" key={d.label}>
											<span className="br-label">{d.label}</span>
											<span className="br-value">{d.value}</span>
											<button
												className={`copy-btn${copiedField === d.label ? ' copied' : ''}`}
												onClick={() => copyDetail(d.label, d.value)}
												aria-label={`Copy ${d.label}`}
											>
												{copiedField === d.label ? (
													'Copied'
												) : (
													<IconCopy />
												)}
											</button>
										</div>
									))}
								</div>
								<button
									className="btn-primary"
									onClick={() => {
										setBankSeen((s) => ({ ...s, [payFor]: true }));
										setPayFor(null);
									}}
								>
									Done
								</button>
							</>
						)}
					</div>
				</div>
			)}

			{uploadFor && (
				<div className="sheet-overlay" onClick={() => setUploadFor(null)}>
					<div className="photo-picker" onClick={(e) => e.stopPropagation()}>
						<div className="pp-title">Upload payment confirmation</div>
						<div className="pp-sub">
							Choose the screenshot of your{' '}
							{uploadFor === 'deposit' ? 'deposit' : 'rent'} transfer
						</div>
						<div className="pp-grid">
							{GUEST_ROLL.map((src, i) => {
								const on = picked === i;
								return (
									<button
										key={i}
										className={`pp-cell${on ? ' selected' : ''}`}
										onClick={() => setPicked(on ? null : i)}
										aria-pressed={on}
									>
										<img src={src} alt="" />
										<span className="pp-check">
											{on && <IconCheck size={12} />}
										</span>
									</button>
								);
							})}
						</div>
						<button
							className="btn-primary"
							disabled={picked == null}
							onClick={saveUpload}
						>
							Upload
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
