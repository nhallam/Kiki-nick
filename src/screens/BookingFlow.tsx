/**
 * The booking-request form, ported from
 * apps/mobile-app/components/bookingRequest/BookingRequestForm.tsx and its
 * steps/. Same step order (Dates → Payment → Guests → Message), same
 * validation rules (min-stay %, ≥100-char intro), same copy.
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
	IconArrowLeft,
	IconCalendar,
	IconCheck,
	IconChevronLeft,
	IconChevronRight,
	IconClose,
	IconPersonCircle,
	IconStar,
	StatusBar,
} from '../ui';

/* ---------- date helpers (stand-ins for date-fns) ---------- */

const MS_DAY = 86400000;
const parseISO = (s: string) => {
	const [y, m, d] = s.split('-').map(Number);
	return new Date(y, m - 1, d);
};
const isSameDay = (a: Date, b: Date) =>
	a.getFullYear() === b.getFullYear() &&
	a.getMonth() === b.getMonth() &&
	a.getDate() === b.getDate();
const diffDays = (a: Date, b: Date) =>
	Math.round((a.getTime() - b.getTime()) / MS_DAY);
const MONTHS = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
];
const ordinal = (n: number) => {
	const s = ['th', 'st', 'nd', 'rd'];
	const v = n % 100;
	return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
export const formatDoMMM = (d: Date) =>
	`${ordinal(d.getDate())} ${MONTHS[d.getMonth()].slice(0, 3)}`;
export const formatDoMMMYYYY = (d: Date) =>
	`${formatDoMMM(d)} ${d.getFullYear()}`;

/**
 * Seasonal min-stay rule mirrored from apps/mobile-app/utils/minStay: a stay
 * must cover ≥50% of the availability window Apr–Aug, ≥30% Sep–Mar.
 */
function minNightsForAvailability(start: Date, end: Date) {
	const availNights = diffDays(end, start);
	const month = start.getMonth(); // 0-based
	const pct = month >= 3 && month <= 7 ? 0.5 : 0.3;
	return Math.ceil(availNights * pct);
}

const nightsWord = (n: number) => (n === 1 ? 'night' : 'nights');

/* ---------- form state ---------- */

type WhoIsStaying = 'individual' | 'couple' | 'group';

export interface BookingFormData {
	moveInDate: Date | null;
	moveOutDate: Date | null;
	whoIsStaying: WhoIsStaying;
	guestProfiles: (UserProfile | null)[];
	peopleIntro: string;
	extraQuestions: string;
}

// Dates and payment are one step: the payment preview is informational, so it
// renders below the calendar as soon as a valid range exists — the flow drops
// from 4 steps to 3.
const STEPS = ['dates', 'guest', 'message'] as const;
type Step = (typeof STEPS)[number];

/* ---------- calendar (port of DateRangeCalendar) ---------- */

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function DateRangeCalendar({
	month,
	selectedStart,
	selectedEnd,
	minDate,
	maxDate,
	onSelectDate,
	onPrevMonth,
	onNextMonth,
	prevMonthLabel,
	nextMonthLabel,
}: {
	month: Date;
	selectedStart: Date | null;
	selectedEnd: Date | null;
	minDate: Date;
	maxDate: Date;
	onSelectDate: (d: Date) => void;
	onPrevMonth: () => void;
	onNextMonth: () => void;
	/** Short label of the adjacent available month ("Sep"), null at bounds. */
	prevMonthLabel: string | null;
	nextMonthLabel: string | null;
}) {
	const first = new Date(month.getFullYear(), month.getMonth(), 1);
	const daysInMonth = new Date(
		month.getFullYear(),
		month.getMonth() + 1,
		0,
	).getDate();
	const startPadding = first.getDay();
	const cells: (Date | null)[] = [
		...Array.from({ length: startPadding }, () => null),
		...Array.from(
			{ length: daysInMonth },
			(_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1),
		),
	];

	const disabled = (d: Date) => d < minDate || d > maxDate;
	const inRange = (d: Date) =>
		!!selectedStart && !!selectedEnd && d > selectedStart && d < selectedEnd;

	return (
		<div className="calendar">
			<div className="month-header">
				<button
					className="month-nav"
					disabled={!prevMonthLabel}
					onClick={onPrevMonth}
				>
					<IconChevronLeft size={22} />
					{prevMonthLabel}
				</button>
				<span className="month-title">
					{MONTHS[month.getMonth()]} {month.getFullYear()}
				</span>
				<button
					className="month-nav right"
					disabled={!nextMonthLabel}
					onClick={onNextMonth}
				>
					{nextMonthLabel}
					<IconChevronRight size={22} />
				</button>
			</div>
			<div className="week-header">
				{DAYS_OF_WEEK.map((d, i) => (
					<span key={i} className="week-day">
						{d}
					</span>
				))}
			</div>
			<div className="days-grid">
				{cells.map((day, i) => {
					if (!day) return <span key={`e${i}`} className="day-cell" />;
					const isStart = !!selectedStart && isSameDay(day, selectedStart);
					const isEnd = !!selectedEnd && isSameDay(day, selectedEnd);
					const isSelected = isStart || isEnd;
					const cls = [
						'day-cell',
						inRange(day) && 'in-range',
						isStart && selectedEnd && 'range-start',
						isEnd && 'range-end',
					]
						.filter(Boolean)
						.join(' ');
					return (
						<button
							key={day.toISOString()}
							className={cls}
							disabled={disabled(day)}
							onClick={() => onSelectDate(day)}
						>
							<span className={`day-content${isSelected ? ' selected' : ''}`}>
								{day.getDate()}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

/* ---------- Step 1: Dates ---------- */

function DatesStep({
	listing,
	formData,
	onChange,
}: {
	listing: Listing;
	formData: BookingFormData;
	onChange: (d: Partial<BookingFormData>) => void;
}) {
	const availStart = parseISO(listing.availableStart);
	const availEnd = parseISO(listing.availableEnd);

	// One calendar page per month of the availability window, with named
	// prev/next arrows (matches the production DatesStep).
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
	const prevMonthLabel =
		monthIndex > 0 ? MONTHS[months[monthIndex - 1].getMonth()].slice(0, 3) : null;
	const nextMonthLabel =
		monthIndex < months.length - 1
			? MONTHS[months[monthIndex + 1].getMonth()].slice(0, 3)
			: null;

	const handleSelect = (date: Date) => {
		if (!formData.moveInDate || formData.moveOutDate) {
			onChange({ moveInDate: date, moveOutDate: null });
		} else if (date <= formData.moveInDate) {
			onChange({ moveInDate: date, moveOutDate: null });
		} else {
			onChange({ moveOutDate: date });
		}
	};

	const selectFullDuration = () =>
		onChange({ moveInDate: availStart, moveOutDate: availEnd });

	const nights =
		formData.moveInDate && formData.moveOutDate
			? diffDays(formData.moveOutDate, formData.moveInDate)
			: 0;
	const minNights = minNightsForAvailability(availStart, availEnd);
	const daysShort =
		formData.moveInDate && formData.moveOutDate
			? Math.max(0, minNights - nights)
			: 0;
	const isShort = daysShort > 0;
	const isFullDuration =
		!!formData.moveInDate &&
		!!formData.moveOutDate &&
		isSameDay(formData.moveInDate, availStart) &&
		isSameDay(formData.moveOutDate, availEnd);

	// Guide the next tap: pick move-in first, then move-out.
	const hint = !formData.moveInDate
		? 'Tap your move-in date to start'
		: !formData.moveOutDate
			? 'Now tap your move-out date'
			: null;

	const availNights = diffDays(availEnd, availStart);
	const hasValidRange =
		!!formData.moveInDate && !!formData.moveOutDate && !isShort;

	return (
		<>
			<div className="step-title">When do you want to move in and out?</div>
			<div className="avail-context">
				<IconCalendar size={15} />
				{listing.listerName}'s dates: {formatDoMMM(availStart)} –{' '}
				{formatDoMMM(availEnd)} · {availNights} {nightsWord(availNights)}
			</div>
			<button
				className={`tip-card actionable${isFullDuration ? ' done' : ''}`}
				onClick={selectFullDuration}
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
			{hint && <div className="date-hint">{hint}</div>}
			{formData.moveInDate && formData.moveOutDate && (
				<div className={`selected-card${isShort ? ' short' : ''}`}>
					<div className="header">
						<IconCalendar size={18} />
						Selected Dates:
					</div>
					<div className="value">
						{formatDoMMM(formData.moveInDate)} →{' '}
						{formatDoMMM(formData.moveOutDate)} · {nights} {nightsWord(nights)}
						{isShort ? ` (${daysShort} ${nightsWord(daysShort)} short)` : ''}
					</div>
				</div>
			)}
			<DateRangeCalendar
				month={month}
				selectedStart={formData.moveInDate}
				selectedEnd={formData.moveOutDate}
				minDate={availStart}
				maxDate={availEnd}
				onSelectDate={handleSelect}
				onPrevMonth={() => setMonthIndex((i) => Math.max(0, i - 1))}
				onNextMonth={() =>
					setMonthIndex((i) => Math.min(months.length - 1, i + 1))
				}
				prevMonthLabel={prevMonthLabel}
				nextMonthLabel={nextMonthLabel}
			/>
			{isShort && (
				<div className="min-stay-error">
					Too short for {listing.listerName} 😭 — you'll need at least{' '}
					{minNights} nights of their dates.
				</div>
			)}
			{hasValidRange && (
				<div className="payment-reveal">
					<PaymentSection listing={listing} formData={formData} />
				</div>
			)}
		</>
	);
}

/* ---------- Payment preview (inline on the Dates step) ---------- */

interface SchedulePayment {
	amount: number;
	date?: Date; // undefined → due on signing
}

/**
 * Mirror of the API's rent schedule: stays under 45 nights are one payment due
 * on signing; longer stays split into ~30-night blocks, the first due on
 * signing and the rest due at the start of each block.
 */
function computeRentPayments(
	moveIn: Date,
	nights: number,
	nightlyRate: number,
): SchedulePayment[] {
	if (nights < 45) {
		return [{ amount: nights * nightlyRate }];
	}
	const payments: SchedulePayment[] = [];
	for (let start = 0; start < nights; start += 30) {
		const blockNights = Math.min(30, nights - start);
		payments.push({
			amount: blockNights * nightlyRate,
			date:
				start === 0
					? undefined
					: new Date(moveIn.getTime() + start * MS_DAY),
		});
	}
	return payments;
}

/**
 * Payment schedule as a plain vertical stepper (delivery-tracking pattern):
 * events read top-to-bottom — Move in, each payment, Move out. Same
 * information as the old timeline graphic, none of the abstraction. Handles
 * one payment or many (45+ day splits) with the same layout.
 */
function PaymentScheduleGraphic({
	payments,
	moveIn,
	moveOut,
}: {
	payments: SchedulePayment[];
	moveIn: Date;
	moveOut: Date;
}) {
	return (
		<div className="pay-steps">
			<div className="pay-step">
				<div className="pay-step-rail">
					<span className="pay-step-dot">
						<IconCalendar size={13} />
					</span>
					<span className="pay-step-line" />
				</div>
				<div className="pay-step-body">
					<div className="pay-step-title">Move in</div>
					<div className="pay-step-sub">{formatDoMMM(moveIn)}</div>
				</div>
			</div>

			{payments.map((payment, index) => (
				<div key={index} className="pay-step">
					<div className="pay-step-rail">
						<span className="pay-step-dot pay">£</span>
						<span className="pay-step-line" />
					</div>
					<div className="pay-step-body">
						<div className="pay-step-card">
							<div className="pay-step-amount">
								£{payment.amount.toLocaleString()}
							</div>
							<div className="pay-step-due">
								{index === 0 || !payment.date
									? 'Due on signing of sublet agreement'
									: `Due on ${formatDoMMM(payment.date)}`}
							</div>
						</div>
					</div>
				</div>
			))}

			<div className="pay-step">
				<div className="pay-step-rail">
					<span className="pay-step-dot">
						<IconCalendar size={13} />
					</span>
				</div>
				<div className="pay-step-body last">
					<div className="pay-step-title">Move out</div>
					<div className="pay-step-sub">{formatDoMMM(moveOut)}</div>
				</div>
			</div>
		</div>
	);
}

function PaymentSection({
	listing,
	formData,
}: {
	listing: Listing;
	formData: BookingFormData;
}) {
	const { moveInDate, moveOutDate } = formData;
	if (!moveInDate || !moveOutDate) return null;
	const nights = diffDays(moveOutDate, moveInDate);
	const rentTotal = nights * listing.nightlyRate;
	const total = rentTotal + listing.securityDeposit;
	const payments = computeRentPayments(moveInDate, nights, listing.nightlyRate);
	const singular = payments.length === 1;

	return (
		<div className="payment-step" style={{ marginTop: 24 }}>
			<div className="section-label" style={{ marginBottom: 0 }}>
				Payment breakdown
			</div>
			<p className="payment-copy">
				Based on {listing.listerName}'s listed £{listing.nightlyRate} nightly
				rate. We don't charge you any fees so{' '}
				{singular ? 'this is the total amount.' : 'these are the total amounts.'}
			</p>

			<PaymentScheduleGraphic
				payments={payments}
				moveIn={moveInDate}
				moveOut={moveOutDate}
			/>

			<div className="summary-card">
				<div className="summary-row">
					<span>
						Rent{' '}
						<span className="summary-sub">
							({nights} {nights === 1 ? 'night' : 'nights'} × £
							{listing.nightlyRate})
						</span>
					</span>
					<span>£{rentTotal}</span>
				</div>
				{listing.securityDeposit > 0 && (
					<div className="summary-row">
						<span>
							Security deposit{' '}
							<span className="summary-sub">(refunded after your stay)</span>
						</span>
						<span>£{listing.securityDeposit}</span>
					</div>
				)}
				<div className="summary-row total">
					<span>Total</span>
					<span>£{total}</span>
				</div>
			</div>

			{nights >= 45 && (
				<div className="info-card">
					With matches 45 days or longer, you can request to split your payment
					across the length of your stay. Both Kiki and {listing.listerName}{' '}
					must approve the new payment schedule.
				</div>
			)}
		</div>
	);
}

/* ---------- Step 2: Guests (guest-list-first) ---------- */

function ProfileCard({
	profile,
	youBadge = false,
}: {
	profile: UserProfile;
	youBadge?: boolean;
}) {
	return (
		<button className="profile-card">
			<Avatar
				variant={profile.type === 'user' ? 'me' : 'generic'}
				initial={profile.name[0]}
				size={48}
				flag={profile.nationalityFlag}
			/>
			<span className="info">
				<span className="name-row">
					{profile.name} <span>{profile.nationalityFlag}</span>
					{youBadge && <span className="you-badge">You</span>}
				</span>
				<span className="subtitle">
					{profile.occupation}, {profile.age}
				</span>
			</span>
			<IconChevronRight size={20} color="#9CA3AF" />
		</button>
	);
}

interface ExtraGuest {
	relation: 'partner' | 'friend';
	profile: UserProfile | null;
}

/** Mock stand-in for the choose/create-profile picker. */
const MOCK_GUEST_NAMES = ['Sam Doe', 'Alex Kim', 'Riva Patel'];
const mockProfile = (i: number): UserProfile => ({
	id: 200 + i,
	name: MOCK_GUEST_NAMES[i % MOCK_GUEST_NAMES.length],
	shortName: MOCK_GUEST_NAMES[i % MOCK_GUEST_NAMES.length].split(' ')[0],
	occupation: 'Friend',
	age: 27 + i,
	nationalityFlag: '🇮🇪',
	type: 'other',
});

/**
 * Guest-list-first (ported from Option 3): no who's-staying type question —
 * the step is just the list of who's coming, starting with you. Adding a
 * guest asks partner-or-friend inline, and Individual / Couple / Group is
 * derived from the list.
 */
function GuestInfoStep({
	listing,
	formData,
	onChange,
}: {
	listing: Listing;
	formData: BookingFormData;
	onChange: (d: Partial<BookingFormData>) => void;
}) {
	const [extras, setExtras] = useState<ExtraGuest[]>(() =>
		formData.guestProfiles.slice(1).map((profile, i) => ({
			relation:
				formData.whoIsStaying === 'couple' && i === 0 ? 'partner' : 'friend',
			profile,
		})),
	);
	const [choosingRelation, setChoosingRelation] = useState(false);

	// Not open to couples ⇒ single-occupancy: no adding guests at all.
	const soloOnly = !listing.openToCouples;
	const partnerTaken = extras.some((g) => g.relation === 'partner');
	const partnerDisabled = partnerTaken;

	const deriveWho = (list: ExtraGuest[]): WhoIsStaying =>
		list.length === 0
			? 'individual'
			: list.length === 1 && list[0].relation === 'partner'
				? 'couple'
				: 'group';
	const DERIVED_LABEL: Record<WhoIsStaying, string> = {
		individual: 'an Individual',
		couple: 'a Couple',
		group: 'a Group',
	};

	// Keep the wizard's form state in sync so validation and the recap step
	// always see the current list.
	const commit = (list: ExtraGuest[]) => {
		setExtras(list);
		onChange({
			whoIsStaying: deriveWho(list),
			guestProfiles: [MY_PROFILE, ...list.map((g) => g.profile)],
		});
	};

	const addGuest = (relation: ExtraGuest['relation']) => {
		commit([...extras, { relation, profile: null }]);
		setChoosingRelation(false);
	};
	const removeGuest = (index: number) =>
		commit(extras.filter((_, i) => i !== index));
	const fillProfile = (index: number) =>
		commit(
			extras.map((g, i) =>
				i === index ? { ...g, profile: mockProfile(index) } : g,
			),
		);

	const hasEmptySlot = extras.some((g) => !g.profile);

	return (
		<>
			<div className="page-title">Guests</div>
			<div className="section-label">Who's coming?</div>

			<div className="profile-section" style={{ marginTop: 0 }}>
				<div className="slot-row">
					<ProfileCard profile={MY_PROFILE} youBadge />
				</div>

				{soloOnly ? (
					<div className="slot-helper">
						This place is only open for one person.
					</div>
				) : (
					<>
				{extras.map((guest, i) => (
					<div key={i} className="slot-row">
						<div className="guest-row-header">
							<span>
								{guest.relation === 'partner' ? 'Your partner' : `Guest ${i + 2}`}{' '}
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
							<ProfileCard profile={guest.profile} />
						) : (
							<button className="choose-slot" onClick={() => fillProfile(i)}>
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
					<div className="slot-helper">
						A profile is required for each person staying.
					</div>
				)}

				<div className="derived-note">
					This will be sent as {DERIVED_LABEL[deriveWho(extras)]} booking.
				</div>
					</>
				)}
			</div>
		</>
	);
}

/* ---------- Step 4: Message ---------- */

/**
 * Sentence starters that beat blank-page paralysis and nudge intros toward
 * what hosts actually want to know. Tapping appends the starter to the intro.
 */
const INTRO_PROMPTS = [
	{ label: "Why I'm in town", starter: "I'm coming to London to " },
	{ label: 'What I do', starter: 'I work as ' },
	{ label: 'My interests', starter: 'Outside work I love ' },
	{ label: 'At home', starter: "Around the house I'm " },
];

function MessageStep({
	listing,
	formData,
	onChange,
	showErrors,
}: {
	listing: Listing;
	formData: BookingFormData;
	onChange: (d: Partial<BookingFormData>) => void;
	showErrors: boolean;
}) {
	const trimmed = formData.peopleIntro.trim().length;
	const introError =
		trimmed === 0
			? `Please tell ${listing.listerName} a little about yourself. Add some interesting details such as your interests, why you're coming to London etc...`
			: trimmed < MIN_PEOPLE_INTRO_LENGTH
				? 'Add a little more detail...'
				: undefined;
	const counterMet = trimmed >= MIN_PEOPLE_INTRO_LENGTH;

	const nights =
		formData.moveInDate && formData.moveOutDate
			? diffDays(formData.moveOutDate, formData.moveInDate)
			: 0;
	const guests = formData.guestProfiles.filter(Boolean).length;
	const total =
		nights * listing.nightlyRate + listing.securityDeposit;

	return (
		<>
			<div className="page-title">Intro yourself to {listing.listerName}</div>
			<p className="msg-description">
				This shows above your instagram profile so think about what you'd like
				to read if you were having someone stay in your home
			</p>
			<textarea
				className={`text-area${showErrors && introError ? ' error' : ''}`}
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
			{showErrors && introError && (
				<div className="helper-error">{introError}</div>
			)}
			<div className="questions-section">
				<div className="section-label">Any quick questions?</div>
				<textarea
					className="text-area small"
					value={formData.extraQuestions}
					placeholder="Optional"
					onChange={(e) => onChange({ extraQuestions: e.target.value })}
				/>
			</div>

			{/* Pre-send recap so nobody sends a request with the wrong details. */}
			{formData.moveInDate && formData.moveOutDate && (
				<div className="recap-card">
					<div className="recap-title">You're requesting</div>
					<div className="recap-line">
						{listing.title} · {formatDoMMM(formData.moveInDate)} →{' '}
						{formatDoMMM(formData.moveOutDate)} · {guests}{' '}
						{guests === 1 ? 'guest' : 'guests'}
					</div>
					<div className="recap-line sub">
						£{total} total (incl. £{listing.securityDeposit} refundable deposit)
						· no payment taken until {listing.listerName} accepts
					</div>
				</div>
			)}
		</>
	);
}

/* ---------- Orchestrator ---------- */

export function BookingFlowScreen({
	listing,
	onClose,
	onSubmitted,
}: {
	listing: Listing;
	onClose: () => void;
	onSubmitted: (formData: BookingFormData) => void;
}) {
	const [stepIndex, setStepIndex] = useState(0);
	const [attemptedNext, setAttemptedNext] = useState(false);
	const [confirmLeave, setConfirmLeave] = useState(false);
	const [formData, setFormData] = useState<BookingFormData>({
		moveInDate: null,
		moveOutDate: null,
		whoIsStaying: 'individual',
		guestProfiles: [MY_PROFILE],
		peopleIntro: `Hey ${listing.listerName}, here is a little info about me:\n`,
		extraQuestions: '',
	});

	const onChange = (d: Partial<BookingFormData>) =>
		setFormData((prev) => ({ ...prev, ...d }));

	const step: Step = STEPS[stepIndex];
	const isFirstStep = stepIndex === 0;
	const isLastStep = stepIndex === STEPS.length - 1;

	const availStart = parseISO(listing.availableStart);
	const availEnd = parseISO(listing.availableEnd);
	const nights =
		formData.moveInDate && formData.moveOutDate
			? diffDays(formData.moveOutDate, formData.moveInDate)
			: 0;
	const isBelowMinStay =
		nights > 0 && nights < minNightsForAvailability(availStart, availEnd);

	const canProceed = useMemo(() => {
		switch (step) {
			case 'dates':
				return (
					!!formData.moveInDate && !!formData.moveOutDate && !isBelowMinStay
				);
			case 'guest':
				// Everyone in the list needs a profile before continuing.
				return (
					formData.guestProfiles.length >= 1 &&
					formData.guestProfiles.every(Boolean)
				);
			case 'message':
				return formData.peopleIntro.trim().length >= MIN_PEOPLE_INTRO_LENGTH;
		}
	}, [step, formData, isBelowMinStay]);

	const handleNext = () => {
		if (!canProceed) {
			setAttemptedNext(true);
			return;
		}
		if (isLastStep) {
			onSubmitted(formData);
		} else {
			setAttemptedNext(false);
			setStepIndex((i) => i + 1);
		}
	};

	const handleBack = () => {
		setAttemptedNext(false);
		setStepIndex((i) => i - 1);
	};

	// Confirm before discarding progress (mirrors the real app's Leave alert).
	const hasProgress = !isFirstStep || !!formData.moveInDate;
	const requestClose = () => {
		if (hasProgress) {
			setConfirmLeave(true);
		} else {
			onClose();
		}
	};

	const STEP_LABELS: Record<Step, string> = {
		dates: 'Dates & payments',
		guest: 'Guests',
		message: 'Introduction',
	};

	return (
		<>
			<div className="modal-backdrop" />
			<div className="modal-screen">
				<div className="form-header">
					<button
						className="icon-btn"
						onClick={isFirstStep ? requestClose : handleBack}
						aria-label={isFirstStep ? 'Close' : 'Back'}
					>
						{isFirstStep ? <IconClose size={26} /> : <IconArrowLeft size={26} />}
					</button>
					<button
						className={`icon-btn${isFirstStep ? ' hidden' : ''}`}
						onClick={requestClose}
						aria-label="Close"
					>
						<IconClose size={26} />
					</button>
				</div>

				<div className="progress-container">
					<div className="progress-meta">
						<span>
							Step {stepIndex + 1} of {STEPS.length}
						</span>
						<span className="progress-meta-sep">·</span>
						<span className="progress-step-name">{STEP_LABELS[step]}</span>
					</div>
					<div className="progress-track">
						<div
							className="progress-fill"
							style={{
								width: `${((stepIndex + 1) / (STEPS.length + 1)) * 100}%`,
							}}
						/>
					</div>
				</div>

				<div className="form-content">
					{step === 'dates' && (
						<DatesStep listing={listing} formData={formData} onChange={onChange} />
					)}
					{step === 'guest' && (
						<GuestInfoStep
							listing={listing}
							formData={formData}
							onChange={onChange}
						/>
					)}
					{step === 'message' && (
						<MessageStep
							listing={listing}
							formData={formData}
							onChange={onChange}
							showErrors={attemptedNext}
						/>
					)}
				</div>

				<div className="form-footer">
					{step === 'dates' && canProceed && (
						<button
							className="footer-price-strip"
							onClick={() => {
								const reduce = window.matchMedia(
									'(prefers-reduced-motion: reduce)',
								).matches;
								document
									.querySelector('.payment-reveal')
									?.scrollIntoView({
										behavior: reduce ? 'auto' : 'smooth',
										block: 'start',
									});
							}}
						>
							<span className="footer-price">
								£{nights * listing.nightlyRate + listing.securityDeposit} total
								· {nights} {nights === 1 ? 'night' : 'nights'}
							</span>
							<span className="footer-price-link">See breakdown ↓</span>
						</button>
					)}
					<button
						className="btn-primary"
						disabled={!isLastStep && !canProceed}
						onClick={handleNext}
					>
						{isLastStep ? 'Send booking request' : 'Continue'}
					</button>
				</div>

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
