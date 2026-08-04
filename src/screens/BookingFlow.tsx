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

const STEPS = ['dates', 'payment', 'guest', 'message'] as const;
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
}: {
	month: Date;
	selectedStart: Date | null;
	selectedEnd: Date | null;
	minDate: Date;
	maxDate: Date;
	onSelectDate: (d: Date) => void;
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
				<button className="month-nav" disabled>
					<IconChevronLeft size={22} />
				</button>
				<span className="month-title">
					{MONTHS[month.getMonth()]} {month.getFullYear()}
				</span>
				<button className="month-nav right" disabled>
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
	const month = new Date(availStart.getFullYear(), availStart.getMonth(), 1);

	const handleSelect = (date: Date) => {
		if (!formData.moveInDate || formData.moveOutDate) {
			onChange({ moveInDate: date, moveOutDate: null });
		} else if (date <= formData.moveInDate) {
			onChange({ moveInDate: date, moveOutDate: null });
		} else {
			onChange({ moveOutDate: date });
		}
	};

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

	return (
		<>
			<div className="step-title">When do you want to move in and out?</div>
			<div className="tip-card">
				<IconStar size={16} />
				book for the full duration to be top pick
			</div>
			{formData.moveInDate && formData.moveOutDate && (
				<div className={`selected-card${isShort ? ' short' : ''}`}>
					<div className="header">
						<IconCalendar size={18} />
						Selected Dates:
					</div>
					<div className="value">
						Paying for {nights} {nightsWord(nights)}
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
			/>
			{isShort && (
				<div className="min-stay-error">
					Too short for {listing.listerName} 😭 — you'll need at least{' '}
					{minNights} nights of their dates.
				</div>
			)}
		</>
	);
}

/* ---------- Step 2: Payment ---------- */

function PaymentScheduleGraphic({
	amount,
	moveIn,
	moveOut,
}: {
	amount: number;
	moveIn: Date;
	moveOut: Date;
}) {
	return (
		<div className="schedule-single">
			<div className="schedule-vbar" />
			<div className="schedule-block-wrap">
				<div className="schedule-block">
					<div className="schedule-accent" />
					<div className="schedule-block-text">
						<div className="schedule-amount">£{amount.toLocaleString()}</div>
						<div className="schedule-due">Due on signing of sublet agreement</div>
					</div>
				</div>
			</div>
			<div className="schedule-indicator move-in">
				<span className="schedule-dot" />
				<span className="schedule-line-wrap">
					<span className="schedule-label above">
						{formatDoMMM(moveIn)} - Move in
					</span>
					<span className="schedule-hline" />
				</span>
			</div>
			<div className="schedule-indicator move-out">
				<span className="schedule-dot" />
				<span className="schedule-line-wrap">
					<span className="schedule-hline" />
					<span className="schedule-label below">
						{formatDoMMM(moveOut)} - Move out
					</span>
				</span>
			</div>
		</div>
	);
}

function PaymentStep({
	listing,
	formData,
}: {
	listing: Listing;
	formData: BookingFormData;
}) {
	const { moveInDate, moveOutDate } = formData;
	if (!moveInDate || !moveOutDate) {
		return (
			<p className="payment-copy">
				Go back and pick your dates to see the payment breakdown.
			</p>
		);
	}
	const nights = diffDays(moveOutDate, moveInDate);
	const rentTotal = nights * listing.nightlyRate;
	const total = rentTotal + listing.securityDeposit;

	return (
		<div className="payment-step">
			<div className="dates-card">
				<div className="title">Selected Dates</div>
				<div className="row">
					<div className="col">
						<span className="label">Move In</span>
						<span className="value">{formatDoMMMYYYY(moveInDate)}</span>
					</div>
					<div className="col">
						<span className="label">Move Out</span>
						<span className="value">{formatDoMMMYYYY(moveOutDate)}</span>
					</div>
				</div>
			</div>

			<p className="payment-copy">
				Here's a breakdown of the payments you'd make (based on{' '}
				{listing.listerName}'s listed £{listing.nightlyRate} nightly rate)
			</p>
			<p className="payment-copy">
				We don't charge you any fees so this is the total amount.
			</p>

			<PaymentScheduleGraphic
				amount={rentTotal}
				moveIn={moveInDate}
				moveOut={moveOutDate}
			/>

			<div className="summary-card">
				<div className="summary-row">
					<span>Rent</span>
					<span>£{rentTotal}</span>
				</div>
				{listing.securityDeposit > 0 && (
					<div className="summary-row">
						<span>Security deposit</span>
						<span>£{listing.securityDeposit}</span>
					</div>
				)}
				<div className="summary-row total">
					<span>Total</span>
					<span>£{total}</span>
				</div>
			</div>
		</div>
	);
}

/* ---------- Step 3: Guests ---------- */

const GUEST_TYPE_OPTIONS: {
	value: WhoIsStaying;
	label: string;
	description: string;
}[] = [
	{ value: 'individual', label: 'Individual', description: 'Just me' },
	{ value: 'couple', label: 'Couple', description: 'Me and my partner' },
	{
		value: 'group',
		label: '2 or more people',
		description: 'Me and one friend or multiple friends',
	},
];

const BOOKING_TYPE_TITLE: Record<WhoIsStaying, string> = {
	individual: 'Individual',
	couple: 'Couple',
	group: 'Group',
};

function ProfileCard({ profile }: { profile: UserProfile }) {
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
				</span>
				<span className="subtitle">
					{profile.occupation}, {profile.age}
				</span>
			</span>
			<IconChevronRight size={20} color="#9CA3AF" />
		</button>
	);
}

function GuestInfoStep({
	listing,
	formData,
	onChange,
}: {
	listing: Listing;
	formData: BookingFormData;
	onChange: (d: Partial<BookingFormData>) => void;
}) {
	const isCoupleDisabled = !listing.openToCouples;
	const isGroup = formData.whoIsStaying === 'group';

	const setType = (value: WhoIsStaying) => {
		const guestProfiles: (UserProfile | null)[] =
			value === 'individual'
				? [MY_PROFILE]
				: value === 'couple'
					? [MY_PROFILE, null]
					: [MY_PROFILE, null];
		onChange({ whoIsStaying: value, guestProfiles });
	};

	return (
		<>
			<div className="page-title">Guests</div>
			<div className="section-label">Who'll be staying?</div>
			<div className="options">
				{GUEST_TYPE_OPTIONS.map((option) => {
					const isSelected = formData.whoIsStaying === option.value;
					const isDisabled = option.value === 'couple' && isCoupleDisabled;
					return (
						<button
							key={option.value}
							className={`option-card${isDisabled ? ' disabled' : ''}`}
							disabled={isDisabled}
							onClick={() => setType(option.value)}
						>
							<span>
								<div className="option-label">{option.label}</div>
								<div className="option-desc">{option.description}</div>
							</span>
							<span className={`check-circle${isSelected ? ' selected' : ''}`}>
								{isSelected && <IconCheck size={15} color="#fff" />}
							</span>
						</button>
					);
				})}
			</div>

			<div className="profile-section">
				<div className="booking-info-card">
					<IconPersonCircle size={24} color="#9CA3AF" />
					<span>
						<div className="booking-info-title">
							{BOOKING_TYPE_TITLE[formData.whoIsStaying]} Booking
						</div>
						<div className="booking-info-subtitle">
							A profile is required for each person staying
						</div>
					</span>
				</div>

				{!isGroup ? (
					formData.guestProfiles.map((profile, i) => (
						<div key={i} className="slot-row">
							<div className="slot-title">
								{i === 0 ? 'Your profile' : "Your partner's profile"}
							</div>
							{profile ? (
								<ProfileCard profile={profile} />
							) : (
								<button className="choose-slot">
									Choose or create profile
								</button>
							)}
						</div>
					))
				) : (
					<>
						{formData.guestProfiles.map((profile, i) => (
							<div key={i} className="slot-row">
								<div className="guest-row-header">Guest {i + 1}</div>
								{profile ? (
									<ProfileCard profile={profile} />
								) : (
									<button className="choose-slot">
										Choose or create profile
									</button>
								)}
							</div>
						))}
					</>
				)}
			</div>
		</>
	);
}

/* ---------- Step 4: Message ---------- */

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
			case 'payment':
				return true;
			case 'guest': {
				const filled = formData.guestProfiles.filter(Boolean).length;
				const required = formData.whoIsStaying === 'individual' ? 1 : 2;
				return filled >= required;
			}
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

	return (
		<>
			<div className="modal-backdrop" />
			<div className="modal-screen">
				<div className="form-header">
					<button
						className="icon-btn"
						onClick={isFirstStep ? onClose : handleBack}
						aria-label={isFirstStep ? 'Close' : 'Back'}
					>
						{isFirstStep ? <IconClose size={26} /> : <IconArrowLeft size={26} />}
					</button>
					<button
						className={`icon-btn${isFirstStep ? ' hidden' : ''}`}
						onClick={onClose}
						aria-label="Close"
					>
						<IconClose size={26} />
					</button>
				</div>

				<div className="progress-container">
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
					{step === 'payment' && (
						<PaymentStep listing={listing} formData={formData} />
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
					<button
						className="btn-primary"
						disabled={!isLastStep && !canProceed}
						onClick={handleNext}
					>
						{isLastStep ? 'Send booking request' : 'Continue'}
					</button>
				</div>
			</div>
		</>
	);
}
