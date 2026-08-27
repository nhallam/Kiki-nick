/**
 * Mock data for the prototype, mirroring the shapes the real flow gets from
 * bookingRequestApi.getInfoForBookingRequest / getBookingRequestsForUser.
 * Dates match the reference screenshots (Ieva's Room, 21–26 Aug 2026).
 */

export interface Listing {
	id: number;
	listerName: string;
	title: string;
	area: string;
	city: string;
	nightlyRate: number;
	roomType: 'Room' | 'Whole place';
	availableStart: string; // yyyy-mm-dd inclusive (overall span start)
	availableEnd: string; // overall span end
	/**
	 * Distinct availability windows within the span. Most listings have one;
	 * omitted = the whole start–end range. Requests can't cross windows.
	 */
	availabilityWindows?: { start: string; end: string }[];
	/**
	 * Start dates of windows the user has already sent a request for. Those
	 * windows are locked in the UI; the rest stay requestable.
	 */
	requestedWindows?: string[];
	openToCouples: boolean;
	securityDeposit: number;
	nationalityFlag: string; // emoji flag
	description: string;
	favouritedBy: number;
	vouchedForBy: string;
	photoVariant: PhotoVariant;
	/** Avatar variant for the host; defaults derived from photoVariant */
	hostAvatar?: string;
	/** Host profile shown at the bottom of the listing page */
	hostAge: number;
	hostGender: string;
	hostNationality: string;
	hostHometown: string;
	hostJob: string;
	instagram: string;
}

export type PhotoVariant = 'ieva' | 'tash' | 'jake' | 'nina';

export const LISTINGS: Listing[] = [
	{
		id: 1,
		listerName: 'Ieva',
		title: "Ieva's Room",
		area: 'Homerton',
		city: 'London',
		nightlyRate: 35,
		roomType: 'Room',
		availableStart: '2026-08-21',
		availableEnd: '2026-10-09',
		availabilityWindows: [
			{ start: '2026-08-21', end: '2026-08-26' },
			{ start: '2026-09-04', end: '2026-09-11' },
			{ start: '2026-10-02', end: '2026-10-09' },
		],
		openToCouples: false,
		securityDeposit: 160,
		nationalityFlag: '🇱🇹',
		description:
			'A bright, spacious room with a king-size bed, large windows, and a private en-suite bathroom with a shower and toilet. The flat is clean and minimal and feels really calm. You will have the whole place to yourself while I am away, perfect for exploring East London.',
		favouritedBy: 1,
		vouchedForBy: 'Sara',
		photoVariant: 'ieva',
		hostAge: 27,
		hostGender: 'Female',
		hostNationality: 'Lithuanian',
		hostHometown: 'Vilnius, Lithuania',
		hostJob: 'Product designer',
		instagram: 'ieva.kas',
	},
	{
		// Ryan's place — the host phone's listing. The windows here are the
		// trips on his Hosting tab; Melissa has requested the August one.
		id: 2,
		listerName: 'Ryan',
		title: "Ryan's Apartment",
		area: 'Hackney',
		city: 'London',
		nightlyRate: 67,
		roomType: 'Whole place',
		availableStart: '2026-08-26',
		availableEnd: '2026-09-19',
		availabilityWindows: [
			{ start: '2026-08-26', end: '2026-08-29' },
			{ start: '2026-09-12', end: '2026-09-19' },
		],
		requestedWindows: ['2026-08-26'],
		openToCouples: true,
		securityDeposit: 150,
		nationalityFlag: '🇳🇿',
		description:
			'A bright one-bed apartment two minutes from London Fields, with a big desk for remote work, fast wifi and a sunny balcony. The whole place is yours while I am away.',
		favouritedBy: 4,
		vouchedForBy: 'Nina',
		photoVariant: 'jake',
		hostAvatar: 'ryan',
		hostAge: 31,
		hostGender: 'Male',
		hostNationality: 'New Zealander',
		hostHometown: 'Auckland, New Zealand',
		hostJob: 'Architect',
		instagram: 'ryan.draws',
	},
	{
		// Three windows inside a two-month span, with a request already sent
		// for the middle one.
		id: 3,
		listerName: 'Nina',
		title: "Nina's Flat",
		area: 'Peckham',
		city: 'London',
		nightlyRate: 48,
		roomType: 'Whole place',
		availableStart: '2026-09-05',
		availableEnd: '2026-10-31',
		availabilityWindows: [
			{ start: '2026-09-05', end: '2026-09-12' },
			{ start: '2026-09-26', end: '2026-10-03' },
			{ start: '2026-10-24', end: '2026-10-31' },
		],
		requestedWindows: ['2026-09-26'],
		openToCouples: true,
		securityDeposit: 200,
		nationalityFlag: '🇪🇸',
		description:
			'A one-bed flat two minutes from Peckham Rye station, with a sunny balcony, a proper kitchen and a record player. Quiet street, great bakeries, and the park is a five minute walk away.',
		favouritedBy: 6,
		vouchedForBy: 'Marco',
		photoVariant: 'nina',
		hostAge: 31,
		hostGender: 'Female',
		hostNationality: 'Spanish',
		hostHometown: 'Valencia, Spain',
		hostJob: 'Chef',
		instagram: 'nina.cooks',
	},
];

const SHORT_MONTHS = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const parseISODate = (s: string) => {
	const [y, m, d] = s.split('-').map(Number);
	return new Date(y, m - 1, d);
};

export const shortDate = (d: Date) =>
	`${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;

/** The listing's availability windows (falls back to the overall span). */
export const listingWindows = (listing: Listing) =>
	listing.availabilityWindows ?? [
		{ start: listing.availableStart, end: listing.availableEnd },
	];

/** "16 Aug - 31 Oct" for listing cards / chips ("+2 more" when windowed). */
export const availabilityRange = (listing: Listing) => {
	const windows = listingWindows(listing);
	const first = `${shortDate(parseISODate(windows[0].start))} - ${shortDate(parseISODate(windows[0].end))}`;
	return windows.length > 1 ? `${first} +${windows.length - 1} more` : first;
};

export const windowNights = (w: { start: string; end: string }) =>
	Math.round(
		(parseISODate(w.end).getTime() - parseISODate(w.start).getTime()) /
			86400000,
	);

/** True when the user already has a request in for this window. */
export const isWindowRequested = (
	listing: Listing,
	w: { start: string; end: string },
) => (listing.requestedWindows ?? []).includes(w.start);

export const availabilityNights = (listing: Listing) =>
	listingWindows(listing).reduce((sum, w) => sum + windowNights(w), 0);

export interface UserProfile {
	id: number;
	name: string;
	shortName: string;
	occupation: string;
	age: number;
	nationalityFlag: string;
	type: 'user' | 'partner' | 'other';
}

/* Matching-flow personas: Melissa is the guest, Ryan the host. */
export const MY_PROFILE: UserProfile = {
	id: 101,
	name: 'Melissa',
	shortName: 'Melissa',
	occupation: 'Marketing Manager',
	age: 28,
	nationalityFlag: '🇦🇺',
	type: 'user',
};

export const HOST_PROFILE: UserProfile = {
	id: 201,
	name: 'Ryan',
	shortName: 'Ryan',
	occupation: 'Architect',
	age: 31,
	nationalityFlag: '🇳🇿',
	type: 'user',
};

/**
 * The user's saved profiles — Change profile in the guests sheet cycles
 * through these. Same person, different presentation.
 */
export const MY_PROFILES: UserProfile[] = [
	MY_PROFILE,
	{
		id: 103,
		name: 'Melissa',
		shortName: 'Melissa',
		occupation: 'Product Designer',
		age: 28,
		nationalityFlag: '🇦🇺',
		type: 'user',
	},
];

export const OTHER_PROFILES: UserProfile[] = [
	{
		id: 102,
		name: 'Sam Doe',
		shortName: 'Sam',
		occupation: 'Designer',
		age: 27,
		nationalityFlag: '🇮🇪',
		type: 'other',
	},
];

export interface SentRequest {
	id: number;
	title: string;
	dates: string;
	nightlyRate: number;
	status: string;
	photoVariant: PhotoVariant;
	/** The listing the request is for, when it exists in this prototype */
	listingId?: number;
}

/** Melissa's active requests — the Ryan one is the pair's shared story. */
export const EXISTING_REQUESTS: SentRequest[] = [
	{
		id: 902,
		listingId: 2,
		title: "Ryan's Apartment in Hackney, London",
		dates: '26 - 29 Aug',
		nightlyRate: 67,
		status: 'In review by host',
		photoVariant: 'jake',
	},
	{
		id: 901,
		listingId: 3,
		title: "Nina's Flat in Peckham, London",
		dates: '26 Sep - 3 Oct',
		nightlyRate: 48,
		status: 'In review by host',
		photoVariant: 'nina',
	},
];

export const MIN_PEOPLE_INTRO_LENGTH = 100;
