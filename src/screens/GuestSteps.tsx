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
	setGuestState,
	setSwapState,
	useSwapState,
	withdrawReservation,
} from '../store';
import { HostFlowSteps, REQUEST_PREVIEWS } from './HostRequest';
import { PhotoDeck } from './PhotoDeck';
import { AgreementModal, DocIllustration } from './Reserved';
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
	const guest = 'Melissa';
	const preview = REQUEST_PREVIEWS[guest];
	const listing = LISTINGS.find((l) => l.listerName === 'Ryan')!;
	const rentTotal = preview.nights * listing.nightlyRate;

	const [showAgreement, setShowAgreement] = useState(false);
	const [confirmWithdraw, setConfirmWithdraw] = useState(false);
	// Which payment is being uploaded ('deposit' | 'rent'), plus selection
	const [uploadFor, setUploadFor] = useState<'deposit' | 'rent' | null>(null);
	const [picked, setPicked] = useState<number | null>(null);

	// The 3 steps: agreement (both signatures), deposit, rent
	const stepsDone =
		(swap.guestSigned && swap.hostSigned ? 1 : 0) +
		(swap.depositPaid ? 1 : 0) +
		(swap.rentPaid ? 1 : 0);
	const bothSigned = swap.guestSigned && swap.hostSigned;

	// Auto-confirm can complete from either phone — whoever finishes the
	// last step tips it over.
	useEffect(() => {
		if (swap.melissa === 'reserved' && stepsDone === 3) {
			const t = window.setTimeout(() => setGuestState(guest, 'confirmed'), 700);
			return () => window.clearTimeout(t);
		}
	}, [swap.melissa, stepsDone, guest]);

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

	// Ryan confirmed — this route turns into her celebration.
	if (swap.melissa === 'confirmed') {
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
						Hackney, 26 - 29 Aug.
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

	return (
		<div className="screen">
			<StatusBar time="12:13" />
			<div className="form-header review-head with-back no-rule">
				<button className="icon-btn review-back" onClick={onBack} aria-label="Back">
					<IconChevronLeft size={26} />
				</button>
				<HostFlowSteps current={2} />
				<span style={{ width: 44 }} />
			</div>

			<div className="form-content" style={{ paddingTop: 0 }}>
				{/* The place this is all for */}
				<div className="guest-steps-listing">
					<span className="gsl-thumb">
						<RoomPhoto variant={listing.photoVariant} />
					</span>
					<span className="gsl-body">
						<span className="gsl-title">Ryan's Apartment</span>
						<span className="gsl-sub">26 - 29 Aug · {preview.nights} nights · Hackney, London</span>
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
							<PayCheque
								which="rent"
								label="Rent"
								amount={rentTotal}
								shot={swap.rentShot}
							/>
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
								? 'Confirming your booking…'
								: `${stepsDone} of 3 steps complete`}
						</span>
						<ReserveTimer note="" inline />
					</div>
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
						Withdraw my request
					</button>
				)}
			</div>

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
