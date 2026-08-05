/**
 * Option 3 — review-centric request screen (Airbnb checkout pattern, adapted
 * to Kiki's request-to-book model). One "Review and request" hub shows the
 * whole request — dates, guests, price, intro — with Change buttons opening
 * focused editor sheets. No linear wizard; the send CTA sits under the full
 * picture. Kiki rules preserved: seasonal min-stay, ≥100-char intro, no
 * payment until the host accepts, rank step after submit.
 */
import React, { useMemo, useState } from 'react';

import {
	Listing,
	MIN_PEOPLE_INTRO_LENGTH,
	MY_PROFILE,
	UserProfile,
} from '../data';
import {
	Avatar,
	IconCalendar,
	IconCheck,
	IconClose,
	IconPersonCircle,
	IconStar,
	RoomPhoto,
} from '../ui';
import {
	BookingFormData,
	DateRangeCalendar,
	INTRO_PROMPTS,
	MONTHS,
	PaymentScheduleGraphic,
	computeRentPayments,
	diffDays,
	formatDoMMM,
	minNightsForAvailability,
	parseISO,
} from './BookingFlow';

const nightsWord = (n: number) => (n === 1 ? 'night' : 'nights');

/* ---------- Dates editor sheet ---------- */

function DatesSheet({
	listing,
	moveInDate,
	moveOutDate,
	onSave,
	onClose,
}: {
	listing: Listing;
	moveInDate: Date | null;
	moveOutDate: Date | null;
	onSave: (moveIn: Date, moveOut: Date) => void;
	onClose: () => void;
}) {
	const availStart = parseISO(listing.availableStart);
	const availEnd = parseISO(listing.availableEnd);
	const [start, setStart] = useState<Date | null>(moveInDate);
	const [end, setEnd] = useState<Date | null>(moveOutDate);

	const months = useMemo(() => {
		const list: Date[] = [];
		const cursor = new Date(availStart.getFullYear(), availStart.getMonth(), 1);
		const last = new Date(availEnd.getFullYear(), availEnd.getMonth(), 1);
		while (cursor <= last) {
			list.push(new Date(cursor));
			cursor.setMonth(cursor.getMonth() + 1);
		}
		return list;
	}, [listing.availableStart, listing.availableEnd]);
	const [monthIndex, setMonthIndex] = useState(0);
	const month = months[Math.min(monthIndex, months.length - 1)];

	const handleSelect = (date: Date) => {
		if (!start || end) {
			setStart(date);
			setEnd(null);
		} else if (date <= start) {
			setStart(date);
			setEnd(null);
		} else {
			setEnd(date);
		}
	};

	const nights = start && end ? diffDays(end, start) : 0;
	const minNights = minNightsForAvailability(availStart, availEnd);
	const daysShort = start && end ? Math.max(0, minNights - nights) : 0;
	const isShort = daysShort > 0;
	const isFullDuration =
		!!start &&
		!!end &&
		start.getTime() === availStart.getTime() &&
		end.getTime() === availEnd.getTime();
	const canSave = !!start && !!end && !isShort;

	return (
		<div className="sheet-overlay" onClick={onClose}>
			<div className="editor-sheet" onClick={(e) => e.stopPropagation()}>
				<div className="editor-head">
					<span className="editor-title">Dates</span>
					<button className="icon-btn" onClick={onClose} aria-label="Close">
						<IconClose size={24} />
					</button>
				</div>
				<div className="editor-body">
					<div className="avail-context">
						<IconCalendar size={15} />
						{listing.listerName}'s dates: {formatDoMMM(availStart)} –{' '}
						{formatDoMMM(availEnd)}
					</div>
					<button
						className={`tip-card actionable${isFullDuration ? ' done' : ''}`}
						onClick={() => {
							setStart(availStart);
							setEnd(availEnd);
						}}
					>
						<span className="tip-text">
							<IconStar size={16} />
							book for the full duration to be top pick
						</span>
						<span className="tip-action">
							{isFullDuration ? (
								<>
									<IconCheck size={14} /> Selected
								</>
							) : (
								'Select all'
							)}
						</span>
					</button>
					{start && end && (
						<div className={`selected-card${isShort ? ' short' : ''}`}>
							<div className="header">
								<IconCalendar size={18} />
								Selected Dates:
							</div>
							<div className="value">
								{formatDoMMM(start)} → {formatDoMMM(end)} · {nights}{' '}
								{nightsWord(nights)}
								{isShort ? ` (${daysShort} ${nightsWord(daysShort)} short)` : ''}
							</div>
						</div>
					)}
					<DateRangeCalendar
						month={month}
						selectedStart={start}
						selectedEnd={end}
						minDate={availStart}
						maxDate={availEnd}
						onSelectDate={handleSelect}
						onPrevMonth={() => setMonthIndex((i) => Math.max(0, i - 1))}
						onNextMonth={() =>
							setMonthIndex((i) => Math.min(months.length - 1, i + 1))
						}
						prevMonthLabel={
							monthIndex > 0
								? MONTHS[months[monthIndex - 1].getMonth()].slice(0, 3)
								: null
						}
						nextMonthLabel={
							monthIndex < months.length - 1
								? MONTHS[months[monthIndex + 1].getMonth()].slice(0, 3)
								: null
						}
					/>
					{isShort && (
						<div className="min-stay-error">
							Too short for {listing.listerName} 😭 — you'll need at least{' '}
							{minNights} nights of their dates.
						</div>
					)}
				</div>
				<div className="editor-footer">
					<button
						className="btn-primary square"
						disabled={!canSave}
						onClick={() => canSave && onSave(start!, end!)}
					>
						Save dates
					</button>
				</div>
			</div>
		</div>
	);
}

/* ---------- Guests editor sheet (guest-list-first) ---------- */

interface ExtraGuest {
	relation: 'partner' | 'friend';
	profile: UserProfile | null;
}

/**
 * No "who's staying" type question: the sheet is just the list of who's
 * coming, starting with you. Adding a guest asks "partner or friend?" inline,
 * and Individual / Couple / Group is derived from the list.
 */
function GuestsSheet({
	listing,
	whoIsStaying,
	guestProfiles,
	onSave,
	onClose,
}: {
	listing: Listing;
	whoIsStaying: BookingFormData['whoIsStaying'];
	guestProfiles: (UserProfile | null)[];
	onSave: (
		who: BookingFormData['whoIsStaying'],
		profiles: (UserProfile | null)[],
	) => void;
	onClose: () => void;
}) {
	const [extras, setExtras] = useState<ExtraGuest[]>(() =>
		guestProfiles.slice(1).map((profile, i) => ({
			relation:
				whoIsStaying === 'couple' && i === 0 ? 'partner' : 'friend',
			profile,
		})),
	);
	const [choosingRelation, setChoosingRelation] = useState(false);

	const partnerTaken = extras.some((g) => g.relation === 'partner');
	const partnerDisabled = !listing.openToCouples || partnerTaken;

	const derivedWho: BookingFormData['whoIsStaying'] =
		extras.length === 0
			? 'individual'
			: extras.length === 1 && extras[0].relation === 'partner'
				? 'couple'
				: 'group';
	const DERIVED_LABEL: Record<BookingFormData['whoIsStaying'], string> = {
		individual: 'an Individual',
		couple: 'a Couple',
		group: 'a Group',
	};

	const addGuest = (relation: ExtraGuest['relation']) => {
		setExtras((prev) => [...prev, { relation, profile: null }]);
		setChoosingRelation(false);
	};
	const removeGuest = (index: number) =>
		setExtras((prev) => prev.filter((_, i) => i !== index));

	const hasEmptySlot = extras.some((g) => !g.profile);

	return (
		<div className="sheet-overlay" onClick={onClose}>
			<div className="editor-sheet" onClick={(e) => e.stopPropagation()}>
				<div className="editor-head">
					<span className="editor-title">Guests</span>
					<button className="icon-btn" onClick={onClose} aria-label="Close">
						<IconClose size={24} />
					</button>
				</div>
				<div className="editor-body">
					<div className="section-label">Who's coming?</div>

					<div className="slot-row">
						<div className="profile-card">
							<Avatar
								variant="me"
								initial={MY_PROFILE.name[0]}
								size={48}
								flag={MY_PROFILE.nationalityFlag}
							/>
							<span className="info">
								<span className="name-row">
									{MY_PROFILE.name} <span>{MY_PROFILE.nationalityFlag}</span>
									<span className="you-badge">You</span>
								</span>
								<span className="subtitle">
									{MY_PROFILE.occupation}, {MY_PROFILE.age}
								</span>
							</span>
						</div>
					</div>

					{extras.map((guest, i) => (
						<div key={i} className="slot-row">
							<div className="guest-row-header">
								<span>
									{guest.relation === 'partner'
										? 'Your partner'
										: `Guest ${i + 2}`}{' '}
									<span className="relation-tag">
										{guest.relation === 'partner' ? 'Partner' : 'Friend'}
									</span>
								</span>
								<button
									className="guest-remove"
									onClick={() => removeGuest(i)}
									aria-label="Remove guest"
								>
									<IconClose size={16} />
								</button>
							</div>
							{guest.profile ? (
								<div className="profile-card">
									<Avatar initial={guest.profile.name[0]} size={48} />
									<span className="info">
										<span className="name-row">{guest.profile.name}</span>
									</span>
								</div>
							) : (
								<button className="choose-slot">
									Choose or create profile
								</button>
							)}
						</div>
					))}

					{choosingRelation ? (
						<div className="relation-chooser">
							<div className="slot-title">Who are they?</div>
							<div className="relation-chips">
								<button
									className="relation-chip"
									disabled={partnerDisabled}
									onClick={() => addGuest('partner')}
								>
									My partner
								</button>
								<button
									className="relation-chip"
									onClick={() => addGuest('friend')}
								>
									A friend
								</button>
								<button
									className="relation-chip cancel"
									onClick={() => setChoosingRelation(false)}
								>
									Cancel
								</button>
							</div>
							{!listing.openToCouples && (
								<div className="slot-helper">
									{listing.listerName}'s place isn't open to couples.
								</div>
							)}
						</div>
					) : (
						<button
							className="choose-slot"
							onClick={() => setChoosingRelation(true)}
						>
							+ Add another guest
						</button>
					)}

					{hasEmptySlot && (
						<div className="slot-helper" style={{ marginTop: 10 }}>
							A profile is required for each person staying.
						</div>
					)}

					<div className="derived-note">
						This will be sent as {DERIVED_LABEL[derivedWho]} booking.
					</div>
				</div>
				<div className="editor-footer">
					<button
						className="btn-primary square"
						onClick={() =>
							onSave(derivedWho, [MY_PROFILE, ...extras.map((g) => g.profile)])
						}
					>
						Save guests
					</button>
				</div>
			</div>
		</div>
	);
}

/* ---------- Review hub ---------- */

export function ReviewRequestScreen({
	listing,
	onClose,
	onSubmitted,
}: {
	listing: Listing;
	onClose: () => void;
	onSubmitted: (formData: BookingFormData) => void;
}) {
	const availStart = parseISO(listing.availableStart);
	const availEnd = parseISO(listing.availableEnd);
	// Short windows start with the full duration prefilled (the recommended
	// choice); long windows start empty so the user picks deliberately.
	const prefill = diffDays(availEnd, availStart) <= 14;

	const [formData, setFormData] = useState<BookingFormData>({
		moveInDate: prefill ? availStart : null,
		moveOutDate: prefill ? availEnd : null,
		whoIsStaying: 'individual',
		guestProfiles: [MY_PROFILE],
		peopleIntro: `Hey ${listing.listerName}, here is a little info about me:\n`,
		extraQuestions: '',
	});
	const [editing, setEditing] = useState<null | 'dates' | 'guests'>(null);
	const [showPriceDetails, setShowPriceDetails] = useState(false);
	const [attemptedSend, setAttemptedSend] = useState(false);
	const [confirmLeave, setConfirmLeave] = useState(false);

	const onChange = (d: Partial<BookingFormData>) =>
		setFormData((prev) => ({ ...prev, ...d }));

	const { moveInDate, moveOutDate } = formData;
	const hasDates = !!moveInDate && !!moveOutDate;
	const nights = hasDates ? diffDays(moveOutDate!, moveInDate!) : 0;
	const rentTotal = nights * listing.nightlyRate;
	const total = rentTotal + listing.securityDeposit;
	const payments = hasDates
		? computeRentPayments(moveInDate!, nights, listing.nightlyRate)
		: [];

	const trimmed = formData.peopleIntro.trim().length;
	const introOk = trimmed >= MIN_PEOPLE_INTRO_LENGTH;
	const counterMet = introOk;
	const introError =
		trimmed === 0
			? `Please tell ${listing.listerName} a little about yourself. Add some interesting details such as your interests, why you're coming to London etc...`
			: !introOk
				? 'Add a little more detail...'
				: undefined;
	const guests = formData.guestProfiles.filter(Boolean).length;
	const canSend = hasDates && introOk;

	const handleSend = () => {
		if (!canSend) {
			setAttemptedSend(true);
			return;
		}
		onSubmitted(formData);
	};

	return (
		<>
			<div className="modal-backdrop" />
			<div className="modal-screen">
				<div className="form-header review-head">
					<span className="review-head-title">Review and request</span>
					<button
						className="icon-btn review-close"
						onClick={() => setConfirmLeave(true)}
						aria-label="Close"
					>
						<IconClose size={26} />
					</button>
				</div>

				<div className="form-content" style={{ paddingTop: 16 }}>
					{/* Summary card */}
					<div className="review-card">
						<div className="review-listing">
							<div className="review-thumb">
								<RoomPhoto variant={listing.photoVariant} />
							</div>
							<div className="review-listing-info">
								<div className="review-listing-title">{listing.title}</div>
								<div className="review-listing-sub">
									Hosted by {listing.listerName} {listing.nationalityFlag}
								</div>
								<div className="review-listing-sub">
									£{listing.nightlyRate} / night ·{' '}
									<span className="vouch-inline">
										Vouched for by {listing.vouchedForBy}
									</span>
								</div>
							</div>
						</div>

						<div className="review-row">
							<span>
								<div className="review-row-label">Dates</div>
								<div className="review-row-value">
									{hasDates ? (
										`${formatDoMMM(moveInDate!)} – ${formatDoMMM(moveOutDate!)} 2026 · ${nights} ${nightsWord(nights)}`
									) : (
										<span className="review-row-empty">Add your dates</span>
									)}
								</div>
							</span>
							<button
								className="review-change"
								onClick={() => setEditing('dates')}
							>
								{hasDates ? 'Change' : 'Add'}
							</button>
						</div>

						<div className="review-row">
							<span>
								<div className="review-row-label">Guests</div>
								<div className="review-row-value">
									{formData.whoIsStaying === 'individual'
										? 'Just you'
										: formData.whoIsStaying === 'couple'
											? 'You and your partner'
											: `${Math.max(guests, 2)} people`}
								</div>
							</span>
							<button
								className="review-change"
								onClick={() => setEditing('guests')}
							>
								Change
							</button>
						</div>

						<div className="review-row">
							<span>
								<div className="review-row-label">Total price</div>
								<div className="review-row-value">
									{hasDates ? (
										<>
											£{total}{' '}
											<span className="review-row-note">
												incl. £{listing.securityDeposit} refundable deposit
											</span>
										</>
									) : (
										<span className="review-row-empty">
											Add dates to see the price
										</span>
									)}
								</div>
							</span>
							{hasDates && (
								<button
									className="review-change"
									onClick={() => setShowPriceDetails((v) => !v)}
								>
									{showPriceDetails ? 'Hide' : 'Details'}
								</button>
							)}
						</div>

						{showPriceDetails && hasDates && (
							<div className="price-details">
								<div className="summary-row">
									<span>
										Rent{' '}
										<span className="summary-sub">
											({nights} {nightsWord(nights)} × £{listing.nightlyRate})
										</span>
									</span>
									<span>£{rentTotal}</span>
								</div>
								<div className="summary-row">
									<span>
										Security deposit{' '}
										<span className="summary-sub">(refunded after your stay)</span>
									</span>
									<span>£{listing.securityDeposit}</span>
								</div>
								<div className="summary-row total">
									<span>Total</span>
									<span>£{total}</span>
								</div>
								<div className="price-details-when">
									<div className="price-details-when-title">When you'd pay</div>
									<PaymentScheduleGraphic
										payments={payments}
										moveIn={moveInDate!}
										moveOut={moveOutDate!}
									/>
									{nights >= 45 && (
										<div className="info-card" style={{ marginTop: 10 }}>
											With matches 45 days or longer, you can request to split
											your payment across the length of your stay. Both Kiki and{' '}
											{listing.listerName} must approve the new payment schedule.
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					<div className="trust-line">
						Sending a request is free — you only pay once{' '}
						{listing.listerName} accepts, and you can withdraw anytime before
						then.
					</div>

					{/* Intro */}
					<div className="section-label" style={{ marginTop: 24 }}>
						Intro yourself to {listing.listerName}
					</div>
					<p className="msg-description">
						This shows above your instagram profile so think about what you'd
						like to read if you were having someone stay in your home
					</p>
					<textarea
						className={`text-area${attemptedSend && introError ? ' error' : ''}`}
						value={formData.peopleIntro}
						placeholder="Tip: 93% of people who get accepted write 4-6 sentences"
						onChange={(e) => onChange({ peopleIntro: e.target.value })}
					/>
					<div className="prompt-chips">
						{INTRO_PROMPTS.map((prompt) => {
							const used = formData.peopleIntro.includes(prompt.starter.trim());
							return (
								<button
									key={prompt.label}
									className={`prompt-chip${used ? ' used' : ''}`}
									disabled={used}
									onClick={() =>
										onChange({
											peopleIntro:
												formData.peopleIntro.replace(/\s+$/, '') +
												'\n' +
												prompt.starter,
										})
									}
								>
									{used ? <IconCheck size={12} /> : '+'} {prompt.label}
								</button>
							);
						})}
					</div>
					<div className={`char-counter${counterMet ? ' met' : ''}`}>
						{counterMet ? (
							<>
								<IconCheck size={13} /> Looks good
							</>
						) : (
							`${trimmed} / ${MIN_PEOPLE_INTRO_LENGTH} characters minimum`
						)}
					</div>
					{attemptedSend && introError && (
						<div className="helper-error">{introError}</div>
					)}

					<div className="questions-section" style={{ marginBottom: 8 }}>
						<div className="section-label">Any quick questions?</div>
						<textarea
							className="text-area small"
							value={formData.extraQuestions}
							placeholder="Optional"
							onChange={(e) => onChange({ extraQuestions: e.target.value })}
						/>
					</div>
				</div>

				<div className="form-footer">
					<button
						className="btn-primary"
						disabled={!canSend && attemptedSend}
						onClick={handleSend}
					>
						Send booking request
					</button>
					<div className="footer-caption">
						{listing.listerName} only sees your request once you send it.
					</div>
				</div>

				{editing === 'dates' && (
					<DatesSheet
						listing={listing}
						moveInDate={formData.moveInDate}
						moveOutDate={formData.moveOutDate}
						onSave={(mi, mo) => {
							onChange({ moveInDate: mi, moveOutDate: mo });
							setEditing(null);
						}}
						onClose={() => setEditing(null)}
					/>
				)}
				{editing === 'guests' && (
					<GuestsSheet
						listing={listing}
						whoIsStaying={formData.whoIsStaying}
						guestProfiles={formData.guestProfiles}
						onSave={(who, profiles) => {
							onChange({ whoIsStaying: who, guestProfiles: profiles });
							setEditing(null);
						}}
						onClose={() => setEditing(null)}
					/>
				)}
				{confirmLeave && (
					<div className="dialog-overlay" onClick={() => setConfirmLeave(false)}>
						<div className="dialog" onClick={(e) => e.stopPropagation()}>
							<div className="dialog-title">Leave booking?</div>
							<div className="dialog-body">
								Are you sure you want to leave? Your progress will be lost.
							</div>
							<div className="dialog-actions">
								<button
									className="dialog-btn"
									onClick={() => setConfirmLeave(false)}
								>
									Stay
								</button>
								<button className="dialog-btn destructive" onClick={onClose}>
									Leave
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	);
}
