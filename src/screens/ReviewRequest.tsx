/**
 * Round 2 — review-centric request flow (Airbnb checkout pattern, adapted
 * to Kiki's request-to-book model), now in three pages:
 *   1. Booking request — the breakdown: dates, guests, price, with
 *      Change buttons opening focused editor sheets
 *   2. Note to host — intro plus an optional questions box
 *   3. Confirm and send — final recap plus a preview of the request as
 *      the host sees it
 * Kiki rules preserved: seasonal min-stay, ≥100-char intro, no payment
 * until the host accepts, reorder from Trips after submit.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
	Listing,
	MIN_PEOPLE_INTRO_LENGTH,
	isWindowRequested,
	listingWindows,
	MY_PROFILE,
	OTHER_PROFILES,
	UserProfile,
} from '../data';
import {
	Avatar,
	IconCheck,
	IconCalendar,
	IconChevronDown,
	IconChevronLeft,
	IconClose,
	RoomPhoto,
	StatusBar,
} from '../ui';
import {
	BookingFormData,
	DateRangeCalendar,
	MONTHS,
	diffDays,
	formatDoMMM,
	minNightsForAvailability,
	parseISO,
} from './BookingFlow';

const nightsWord = (n: number) => (n === 1 ? 'night' : 'nights');

const sameDay = (a: Date, b: Date) =>
	a.getFullYear() === b.getFullYear() &&
	a.getMonth() === b.getMonth() &&
	a.getDate() === b.getDate();

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
	// A request lives inside one availability window; the calendar disables
	// the gaps and starting a range in another window restarts the selection.
	const windows = useMemo(
		() =>
			listingWindows(listing).map((w) => ({
				start: parseISO(w.start),
				end: parseISO(w.end),
				requested: isWindowRequested(listing, w),
			})),
		[listing],
	);
	const availStart = windows[0].start;
	const availEnd = windows[windows.length - 1].end;
	const windowOf = (d: Date) =>
		windows.find((w) => d >= w.start && d <= w.end) ?? null;

	// The window the sheet opens on: the one the saved dates fall in, else
	// the first that hasn't already been requested.
	const initialWinIndex = useMemo(() => {
		if (moveInDate) {
			const i = windows.findIndex(
				(w) => moveInDate >= w.start && moveInDate <= w.end,
			);
			if (i >= 0) return i;
		}
		const open = windows.findIndex((w) => !w.requested);
		return open >= 0 ? open : 0;
	}, [windows, moveInDate]);

	// Picking a window fills its whole range in, so the common case is one
	// tap; tapping either end of the selection clears it again.
	const [start, setStart] = useState<Date | null>(
		moveInDate ??
			(windows[initialWinIndex].requested
				? null
				: windows[initialWinIndex].start),
	);
	const [end, setEnd] = useState<Date | null>(
		moveOutDate ??
			(windows[initialWinIndex].requested ? null : windows[initialWinIndex].end),
	);
	// Brief message when the user taps dates they've already requested.
	const [toast, setToast] = useState(false);
	const toastTimer = useRef<number | undefined>(undefined);
	const flashRequested = () => {
		setToast(true);
		window.clearTimeout(toastTimer.current);
		toastTimer.current = window.setTimeout(() => setToast(false), 2400);
	};
	useEffect(() => () => window.clearTimeout(toastTimer.current), []);

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
	const [monthIndex, setMonthIndex] = useState(() => {
		const target = windows[initialWinIndex].start;
		const i = months.findIndex(
			(m) =>
				m.getFullYear() === target.getFullYear() &&
				m.getMonth() === target.getMonth(),
		);
		return Math.max(0, i);
	});
	const month = months[Math.min(monthIndex, months.length - 1)];

	// Window stepper: browse windows with the arrows (the calendar follows),
	// or take a whole window with Select.
	const [menuOpen, setMenuOpen] = useState(false);
	const [winIndex, setWinIndex] = useState(initialWinIndex);
	const currentWin = windows[winIndex];
	const gotoWindow = (i: number) => {
		const win = windows[i];
		setWinIndex(i);
		setMenuOpen(false);
		const mi = months.findIndex(
			(m) =>
				m.getFullYear() === win.start.getFullYear() &&
				m.getMonth() === win.start.getMonth(),
		);
		if (mi >= 0) setMonthIndex(mi);
		// Fill the window in ready to send; a requested one can't be taken, so
		// it just clears whatever was selected.
		setStart(win.requested ? null : win.start);
		setEnd(win.requested ? null : win.end);
	};
	const fmtShort = (d: Date) =>
		`${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;

	const handleSelect = (date: Date) => {
		const win = windowOf(date);
		if (!win) return;
		if (win.requested) {
			setWinIndex(windows.indexOf(win));
			flashRequested();
			return;
		}
		setWinIndex(windows.indexOf(win));
		// Tapping either end of the current range clears it, so the dates
		// filled in by the picker can be undone without a Clear button.
		if (start && (sameDay(date, start) || (end && sameDay(date, end)))) {
			setStart(null);
			setEnd(null);
			return;
		}
		if (!start || end || date <= start || windowOf(start) !== win) {
			setStart(date);
			setEnd(null);
		} else {
			setEnd(date);
		}
	};

	const wholeWindowSelected =
		!!start &&
		!!end &&
		sameDay(start, currentWin.start) &&
		sameDay(end, currentWin.end);

	const nights = start && end ? diffDays(end, start) : 0;
	// Min-stay applies to the window the selection is in, not the whole span.
	const selectedWindow = start ? windowOf(start) : null;
	const minNights = selectedWindow
		? minNightsForAvailability(selectedWindow.start, selectedWindow.end)
		: 0;
	const daysShort = start && end ? Math.max(0, minNights - nights) : 0;
	const isShort = daysShort > 0;
	const canSave = !!start && !!end && !isShort;

	return (
		<div className="sheet-overlay" onClick={onClose}>
			<div className="editor-sheet tall" onClick={(e) => e.stopPropagation()}>
				<div className="editor-head">
					<span className="editor-title">Dates</span>
					<button className="icon-btn" onClick={onClose} aria-label="Close">
						<IconClose size={24} />
					</button>
				</div>
				<div className="editor-body">
					<div
						className={`window-stepper${currentWin.requested ? ' requested' : ''}`}
					>
						<div className="ws-top">
							<span className="ws-eyebrow">
								<IconCalendar size={15} />
								Available Dates
							</span>
						</div>
						<div className="ws-main">
							{windows.length > 1 ? (
								<button
									className={`ws-range ws-picker${menuOpen ? ' open' : ''}`}
									onClick={() => setMenuOpen((v) => !v)}
									aria-haspopup="listbox"
									aria-expanded={menuOpen}
								>
									{fmtShort(currentWin.start)} – {fmtShort(currentWin.end)}
									<span className="ws-nights">
										· {diffDays(currentWin.end, currentWin.start)}{' '}
										{nightsWord(diffDays(currentWin.end, currentWin.start))}
									</span>
									<IconChevronDown size={18} />
								</button>
							) : (
								<span className="ws-range">
									{fmtShort(currentWin.start)} – {fmtShort(currentWin.end)}
									<span className="ws-nights">
										· {diffDays(currentWin.end, currentWin.start)}{' '}
										{nightsWord(diffDays(currentWin.end, currentWin.start))}
									</span>
								</span>
							)}
							{currentWin.requested && (
								<span className="ws-status requested">Request sent</span>
							)}
						</div>
						{currentWin.requested && (
							<div className="ws-requested-note">
								You've already asked {listing.listerName} about these dates.
								Pick another window if you'd like a second option.
							</div>
						)}
						{menuOpen && (
							<>
								<div
									className="ws-menu-catch"
									onClick={() => setMenuOpen(false)}
								/>
								<ul className="ws-menu" role="listbox">
									{windows.map((w, i) => (
										<li key={i}>
											<button
												className={`ws-option${i === winIndex ? ' active' : ''}`}
												role="option"
												aria-label={`${fmtShort(w.start)} to ${fmtShort(w.end)}, ${diffDays(w.end, w.start)} nights${w.requested ? ', request already sent' : ''}`}
												aria-selected={i === winIndex}
												onClick={() => gotoWindow(i)}
											>
												<span className="ws-option-main">
													<span className="ws-option-range">
														{fmtShort(w.start)} – {fmtShort(w.end)}
													</span>
													<span className="ws-option-nights">
														{diffDays(w.end, w.start)}{' '}
														{nightsWord(diffDays(w.end, w.start))}
													</span>
												</span>
												{w.requested ? (
													<span className="ws-option-tag">Request sent</span>
												) : (
													i === winIndex && <IconCheck size={16} />
												)}
											</button>
										</li>
									))}
								</ul>
							</>
						)}
					</div>
					{wholeWindowSelected && (
						<div className="ws-hint">
							The whole window is selected. Tap a date to change it.
						</div>
					)}
					<DateRangeCalendar
						month={month}
						selectedStart={start}
						selectedEnd={end}
						minDate={availStart}
						maxDate={availEnd}
						onSelectDate={handleSelect}
						isDateDisabled={(d) => !windowOf(d)}
						isDateRequested={(d) => !!windowOf(d)?.requested}
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
					<div className="cal-legend">
						<span className="cal-legend-item">
							<i className="sw selected" /> Selected
						</span>
						{windows.some((w) => w.requested) && (
							<span className="cal-legend-item">
								<i className="sw requested" /> Request sent
							</span>
						)}
						<span className="cal-legend-item">
							<i className="sw unavailable" /> Not available
						</span>
					</div>
					{isShort && (
						<div className="min-stay-error">
							Too short for {listing.listerName} 😭, you'll need at least{' '}
							{minNights} nights of their dates.
						</div>
					)}
				</div>
				{toast && (
					<div className="sheet-toast" role="status">
						You have sent a request for these dates
					</div>
				)}
				<div className="editor-footer">
					<button
						className="btn-primary square"
						disabled={!canSave}
						onClick={() => canSave && onSave(start!, end!)}
					>
						{start && end
							? `Save dates · ${nights} ${nightsWord(nights)}`
							: 'Save dates'}
					</button>
				</div>
			</div>
		</div>
	);
}

/* ---------- Guests editor sheet (guest-list-first) ---------- */

/**
 * No "who's staying" or relation questions: the sheet is just the list of
 * who's coming, starting with you. Adding a guest goes straight to a
 * profile slot; the booking type is derived from the head count.
 */
function GuestsSheet({
	listing,
	guestProfiles,
	onSave,
	onClose,
}: {
	listing: Listing;
	guestProfiles: (UserProfile | null)[];
	onSave: (
		who: BookingFormData['whoIsStaying'],
		profiles: (UserProfile | null)[],
	) => void;
	onClose: () => void;
}) {
	const me = guestProfiles[0] ?? MY_PROFILE;
	const [extras, setExtras] = useState<(UserProfile | null)[]>(() =>
		guestProfiles.slice(1),
	);

	// Not open to couples ⇒ single-occupancy: no adding guests at all.
	const soloOnly = !listing.openToCouples;

	const derivedWho: BookingFormData['whoIsStaying'] =
		extras.length === 0 ? 'individual' : 'group';

	const addGuest = () => setExtras((prev) => [...prev, null]);
	const fillGuest = (index: number) =>
		setExtras((prev) =>
			prev.map((p, i) => (i === index ? OTHER_PROFILES[0] : p)),
		);
	const removeGuest = (index: number) =>
		setExtras((prev) => prev.filter((_, i) => i !== index));

	const hasEmptySlot = extras.some((g) => !g);

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
					<div className="section-label centered">Who's coming?</div>

					<div className="guest-hero">
						<Avatar
							variant="me"
							initial={me.name[0]}
							size={84}
							flag={me.nationalityFlag}
						/>
						{/* No flag here — the avatar already carries one. */}
						<div className="guest-hero-name">
							{me.name}
							<span className="you-badge">You</span>
						</div>
						<div className="guest-hero-sub">
							{me.occupation}, {me.age}
						</div>
					</div>

					{soloOnly ? (
						<div className="slot-helper centered">
							This place is only open for one person.
						</div>
					) : (
						<>
							{extras.map((profile, i) => (
								<div key={i} className="guest-hero">
									{profile ? (
										<Avatar initial={profile.name[0]} size={84} />
									) : (
										<div className="guest-hero-placeholder">?</div>
									)}
									<div className="guest-hero-name">
										{profile ? profile.name : `Guest ${i + 2}`}
									</div>
									{profile && (
										<div className="guest-hero-sub">
											{profile.occupation}, {profile.age}
										</div>
									)}
									{!profile && (
										<button
											className="choose-slot hero"
											onClick={() => fillGuest(i)}
										>
											Choose or create profile
										</button>
									)}
									<button
										className="guest-hero-remove"
										onClick={() => removeGuest(i)}
									>
										Remove
									</button>
								</div>
							))}

							{hasEmptySlot && (
								<div className="slot-helper centered" style={{ marginTop: 10 }}>
									A profile is required for each person staying.
								</div>
							)}
						</>
					)}
				</div>
				<div className="editor-footer">
					{/* Pinned above Save so it stays put as guest slots grow */}
					{!soloOnly && (
						<button className="add-guest-btn pinned" onClick={addGuest}>
							+ Add guest
						</button>
					)}
					<button
						className="btn-primary square"
						onClick={() => onSave(derivedWho, [me, ...extras])}
					>
						Save guests
					</button>
				</div>
			</div>
		</div>
	);
}

/* ---------- Shared summary card ---------- */

/**
 * The dates / guests / price breakdown. Page 1 uses it with the Change
 * buttons; page 3 shows the same card read-only, so the request the user
 * confirms is laid out exactly as the one they built.
 */
export function ReviewSummaryCard({
	listing,
	hasDates,
	datesValue,
	guestsLabel,
	nights,
	rentTotal,
	total,
	onEditDates,
	onEditGuests,
	intro,
	questions,
}: {
	listing: Listing;
	hasDates: boolean;
	datesValue: string | null;
	guestsLabel: string;
	nights: number;
	rentTotal: number;
	total: number;
	onEditDates?: () => void;
	onEditGuests?: () => void;
	/** When set, the card grows an Intro & Questions row (confirm page). */
	intro?: string;
	questions?: string;
}) {
	// Hidden by default — the note was written moments ago.
	const [showIntro, setShowIntro] = useState(false);
	return (
		<div className="review-card">
			<div className="review-listing">
				<div className="review-thumb">
					<RoomPhoto variant={listing.photoVariant} />
				</div>
				<div className="review-listing-info">
					<div className="review-listing-title">{listing.title}</div>
					<div className="review-listing-sub">£{listing.nightlyRate} / night</div>
				</div>
			</div>

			<div className="review-row">
				<span>
					<div className="review-row-label">Dates</div>
					<div className="review-row-value">
						{hasDates ? (
							datesValue
						) : (
							<span className="review-row-empty">Add your dates</span>
						)}
					</div>
				</span>
				{onEditDates && (
					<button className="review-change" onClick={onEditDates}>
						{hasDates ? 'Change' : 'Add'}
					</button>
				)}
			</div>

			<div className="review-row">
				<span>
					<div className="review-row-label">Guests</div>
					<div className="review-row-value">{guestsLabel}</div>
				</span>
				{onEditGuests && (
					<button className="review-change" onClick={onEditGuests}>
						Change
					</button>
				)}
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
							<span className="review-row-empty">Add dates to see the price</span>
						)}
					</div>
				</span>
			</div>

			{/* Always open — nothing here is worth a tap to reveal. */}
			{hasDates && (
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
					{nights >= 45 && (
						<div className="info-card" style={{ marginTop: 12 }}>
							With matches 45 days or longer, you can request to split your
							payment across the length of your stay. Both Kiki and{' '}
							{listing.listerName} must approve the new payment schedule.
						</div>
					)}
				</div>
			)}

			{intro && (
				<div className="review-row intro-row">
					<span>
						<div className="review-row-label">Intro &amp; Questions</div>
						{showIntro && (
							<div className="review-row-value intro-text">
								<p>{intro}</p>
								{questions && (
									<>
										<div className="review-row-label questions-label">
											Questions
										</div>
										<p>{questions}</p>
									</>
								)}
							</div>
						)}
					</span>
					<button
						className="review-change"
						onClick={() => setShowIntro((v) => !v)}
					>
						{showIntro ? 'Hide' : 'Show'}
					</button>
				</div>
			)}
		</div>
	);
}

/* ---------- Review hub ---------- */

/**
 * Round 2: the hub is now a 3-page flow (client direction, 2026-08-06):
 *   1. Review — the Airbnb-style breakdown (dates / guests / price + sheets)
 *   2. Note — intro to the host plus an optional questions box
 *   3. Confirm — the same summary card, read-only, with the note tucked
 *      into a collapsed section.
 * Form state lives here so back/forward never loses anything.
 */
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
	// A single short window starts with the full duration prefilled (the
	// recommended choice); long spans and multi-window listings start empty
	// so the user picks a window deliberately.
	const prefill =
		listingWindows(listing).length === 1 && diffDays(availEnd, availStart) <= 14;

	const [formData, setFormData] = useState<BookingFormData>({
		moveInDate: prefill ? availStart : null,
		moveOutDate: prefill ? availEnd : null,
		whoIsStaying: 'individual',
		guestProfiles: [MY_PROFILE],
		peopleIntro: `Hey ${listing.listerName}, here is a little info about me:\n`,
		extraQuestions: '',
	});
	const [page, setPage] = useState<1 | 2 | 3>(1);
	const [editing, setEditing] = useState<null | 'dates' | 'guests'>(null);
	const [attemptedContinue, setAttemptedContinue] = useState(false);
	const [confirmLeave, setConfirmLeave] = useState(false);

	const onChange = (d: Partial<BookingFormData>) =>
		setFormData((prev) => ({ ...prev, ...d }));

	const { moveInDate, moveOutDate } = formData;
	const hasDates = !!moveInDate && !!moveOutDate;
	const nights = hasDates ? diffDays(moveOutDate!, moveInDate!) : 0;
	const rentTotal = nights * listing.nightlyRate;
	const total = rentTotal + listing.securityDeposit;

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
	const me = formData.guestProfiles[0] ?? MY_PROFILE;
	const extraGuests = formData.guestProfiles.slice(1).filter(Boolean) as UserProfile[];

	const guestsLabel =
		formData.whoIsStaying === 'individual'
			? 'Just you'
			: formData.whoIsStaying === 'couple'
				? 'You and your partner'
				: `${Math.max(guests, 2)} people`;
	const partyLabel =
		formData.whoIsStaying === 'individual'
			? 'Individual'
			: formData.whoIsStaying === 'couple'
				? 'Couple'
				: `Group of ${Math.max(guests, 2)}`;

	const PAGE_TITLES: Record<1 | 2 | 3, string> = {
		1: 'Booking request',
		2: `Note to ${listing.listerName}`,
		3: 'Confirm and send',
	};

	const handleContinueFromReview = () => {
		// No dates yet? "Continue" takes you straight to picking them.
		if (!hasDates) {
			setEditing('dates');
			return;
		}
		setPage(2);
	};

	const handleContinueFromNote = () => {
		if (!introOk) {
			setAttemptedContinue(true);
			return;
		}
		setPage(3);
	};

	const datesValue = hasDates
		? `${formatDoMMM(moveInDate!)} – ${formatDoMMM(moveOutDate!)} 2026 · ${nights} ${nightsWord(nights)}`
		: null;

	// Back is contextual: pages 2–3 step back through the flow, page 1
	// leaves the flow (guarded — form state would be lost).
	const handleBack = () => {
		if (page > 1) setPage((p) => (p - 1) as 1 | 2);
		else setConfirmLeave(true);
	};

	// Native-style push: slide in from the right on mount, slide back out
	// (revealing the listing behind) before unmounting on leave.
	const [closing, setClosing] = useState(false);
	const handleLeave = () => {
		setConfirmLeave(false);
		setClosing(true);
		setTimeout(onClose, 260);
	};

	return (
		<div className={`screen booking-page${closing ? ' closing' : ''}`}>
			<StatusBar />
			<div className="form-header review-head with-back">
				<button
					className="icon-btn review-back"
					onClick={handleBack}
					aria-label="Back"
				>
					<IconChevronLeft size={26} />
				</button>
				<span className="review-head-titles">
					<span className="review-head-title">{PAGE_TITLES[page]}</span>
				</span>
				<span
					className="head-stepper"
					role="progressbar"
					aria-valuenow={page}
					aria-valuemin={1}
					aria-valuemax={3}
					aria-label={`Step ${page} of 3`}
				>
					<span className="head-stepper-label">Step {page} of 3</span>
					<span className="head-stepper-dots">
						{[1, 2, 3].map((n) => (
							<span
								key={n}
								className={n === page ? 'active' : n < page ? 'done' : ''}
							/>
						))}
					</span>
				</span>
			</div>

			<div className="form-content" style={{ paddingTop: 16 }} key={page}>
				{page === 1 && (
					<>
						<ReviewSummaryCard
							listing={listing}
							hasDates={hasDates}
							datesValue={datesValue}
							guestsLabel={guestsLabel}
							nights={nights}
							rentTotal={rentTotal}
							total={total}
							onEditDates={() => setEditing('dates')}
							onEditGuests={() => setEditing('guests')}
						/>
					</>
				)}

				{page === 2 && (
					<>
						<div className="section-label">
							Intro yourself to {listing.listerName}
						</div>
						<p className="msg-description">
							This shows above your instagram profile so think about what you'd
							like to read if you were having someone stay in your home
						</p>
						<textarea
							className={`text-area${attemptedContinue && introError ? ' error' : ''}`}
							aria-label={`Introduce yourself to ${listing.listerName}`}
							value={formData.peopleIntro}
							placeholder="Tip: 93% of people who get accepted write 4-6 sentences"
							onChange={(e) => onChange({ peopleIntro: e.target.value })}
						/>
						<div className={`char-counter${counterMet ? ' met' : ''}`}>
							{counterMet ? (
								<>
									<IconCheck size={13} /> Looks good
								</>
							) : (
								`${trimmed} / ${MIN_PEOPLE_INTRO_LENGTH} characters minimum`
							)}
						</div>
						{attemptedContinue && introError && (
							<div className="helper-error">{introError}</div>
						)}

						<div className="questions-section" style={{ marginBottom: 8 }}>
							<div className="section-label">
								Any questions for {listing.listerName}?
							</div>
							<p className="msg-description">
								Anything you'd like to ask before you book. Optional.
							</p>
							<textarea
								className="text-area small"
								aria-label={`Questions for ${listing.listerName} (optional)`}
								value={formData.extraQuestions}
								placeholder="Optional"
								onChange={(e) => onChange({ extraQuestions: e.target.value })}
							/>
						</div>
					</>
				)}

				{page === 3 && (
					<>
						{/* Same card as page 1, read-only: what you built is what you
						    confirm. Editing is the back arrow. */}
						<ReviewSummaryCard
							listing={listing}
							hasDates={hasDates}
							datesValue={datesValue}
							guestsLabel={guestsLabel}
							nights={nights}
							rentTotal={rentTotal}
							total={total}
							intro={formData.peopleIntro.trim()}
							questions={formData.extraQuestions.trim() || undefined}
						/>

						<div className="trust-line" style={{ marginTop: 18 }}>
							Sending a request is free. You only pay once{' '}
							{listing.listerName} accepts, and you can withdraw anytime before
							then.
						</div>
					</>
				)}
			</div>

			<div className="form-footer">
				{page === 1 && (
					<>
						<button className="btn-primary" onClick={handleContinueFromReview}>
							Continue
						</button>
						<div className="footer-caption">
							{hasDates
								? `Next you'll write a short note to ${listing.listerName}.`
								: 'Add your dates to continue.'}
						</div>
					</>
				)}
				{page === 2 && (
					<>
						<button className="btn-primary" onClick={handleContinueFromNote}>
							Continue
						</button>
						<div className="footer-caption">
							Next you can check everything before it's sent.
						</div>
					</>
				)}
				{page === 3 && (
					<>
						<button
							className="btn-primary"
							onClick={() => onSubmitted(formData)}
						>
							Send booking request
						</button>
						<div className="footer-caption">
							{listing.listerName} only sees your request once you send it.
						</div>
					</>
				)}
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
							<button className="dialog-btn destructive" onClick={handleLeave}>
								Leave
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
