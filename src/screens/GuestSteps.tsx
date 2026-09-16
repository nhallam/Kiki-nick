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
import { IconCheck, IconChevronLeft, RoomPhoto, StatusBar } from '../ui';
import {
	activeGuest,
	getSwapState,
	guestState,
	setGuestState,
	setSwapState,
	useSwapState,
	withdrawReservation,
} from '../store';
import { HostFlowSteps, REQUEST_PREVIEWS } from './HostRequest';
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
				onClick={() => openUpload(which)}
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
					<span className="c-status upload">Upload</span>
				)}
				{paid && (
					<span className="doc-check">
						<IconCheck size={12} />
					</span>
				)}
			</button>
		);
	};

	/* Split payments: her stay is >1 month out, so she can pay rent in two
	   parts — half now, half due 1 month before move-in. The choice locks
	   once she uploads the first rent payment. Shared by the guided flow's
	   payments screen and the overview. */
	const rent1 = Math.ceil(rentTotal / 2);
	const rentCheques = (
		<>
			{preview.splitAvailable && swap.rentShot == null && (
				<div className="split-block">
					<div className="split-choice">
						<button
							className={`sc-opt${!swap.rentSplit ? ' on' : ''}`}
							onClick={() => setSwapState({ rentSplit: false })}
						>
							Pay in full
						</button>
						<button
							className={`sc-opt${swap.rentSplit ? ' on' : ''}`}
							onClick={() => setSwapState({ rentSplit: true })}
						>
							Two parts
						</button>
					</div>
					<p className="split-note">
						Your stay is over a month away, so you can pay half the rent now
						and the rest by {preview.splitDue}.
					</p>
				</div>
			)}
			{swap.rentSplit ? (
				<>
					<PayCheque
						which="rent"
						label="Rent — 1st half"
						amount={rent1}
						shot={swap.rentShot}
					/>
					<ScheduledCheque
						label="Rent — 2nd half"
						due={preview.splitDue ?? '1 month before move-in'}
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
									<h2 className="wz-title">Ryan reserved your dates!</h2>
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
						<div className="wz-timer">
							<ReserveTimer note="" inline />
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
