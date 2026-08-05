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
	availableStart: string; // yyyy-mm-dd inclusive
	availableEnd: string;
	openToCouples: boolean;
	securityDeposit: number;
	nationalityFlag: string; // emoji flag
	description: string;
	favouritedBy: number;
	vouchedForBy: string;
	photoVariant: PhotoVariant;
	/** Host profile shown at the bottom of the listing page */
	hostAge: number;
	hostGender: string;
	hostNationality: string;
	hostHometown: string;
	hostJob: string;
	instagram: string;
}

export type PhotoVariant = 'ieva' | 'tash' | 'jake';

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
		availableEnd: '2026-08-26',
		openToCouples: false,
		securityDeposit: 160,
		nationalityFlag: '🇱🇹',
		description:
			'A bright, spacious room with a king-size bed, large windows, and a private en-suite bathroom with a shower and toilet. The flat has a clean, minimal aesthetic and is designed to feel calm, comfortable and welcoming. You will have the whole place to yourself while I am away — perfect for exploring East London.',
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
		// Long availability (76 nights) so the 45+ day split-payment path is
		// demoable end-to-end.
		id: 2,
		listerName: 'Jake',
		title: "Jake's Room",
		area: 'London Fields',
		city: 'London',
		nightlyRate: 40,
		roomType: 'Room',
		availableStart: '2026-08-16',
		availableEnd: '2026-10-31',
		openToCouples: true,
		securityDeposit: 180,
		nationalityFlag: '🇬🇧',
		description:
			'A cosy room right by London Fields park, with a big desk for remote work, fast wifi and a sunny shared kitchen. Lido and the best coffee in Hackney within five minutes walk.',
		favouritedBy: 3,
		vouchedForBy: 'Ana',
		photoVariant: 'jake',
		hostAge: 29,
		hostGender: 'Male',
		hostNationality: 'British',
		hostHometown: 'London, England, GB',
		hostJob: 'Musician',
		instagram: 'jake_lf',
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

/** "16 Aug - 31 Oct" for listing cards / chips. */
export const availabilityRange = (listing: Listing) =>
	`${shortDate(parseISODate(listing.availableStart))} - ${shortDate(parseISODate(listing.availableEnd))}`;

export const availabilityNights = (listing: Listing) =>
	Math.round(
		(parseISODate(listing.availableEnd).getTime() -
			parseISODate(listing.availableStart).getTime()) /
			86400000,
	);

export interface UserProfile {
	id: number;
	name: string;
	shortName: string;
	occupation: string;
	age: number;
	nationalityFlag: string;
	type: 'user' | 'partner' | 'other';
}

export const MY_PROFILE: UserProfile = {
	id: 101,
	name: 'Reviewer 1 Tester',
	shortName: 'Reviewer',
	occupation: 'Kiki Tester',
	age: 26,
	nationalityFlag: '🇬🇧',
	type: 'user',
};

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
}

/** Pre-existing active request the new one gets ranked against. */
export const EXISTING_REQUESTS: SentRequest[] = [
	{
		id: 900,
		title: "Tash's Room in Clapham common, London",
		dates: '19 Aug - 22 Aug',
		nightlyRate: 42,
		status: 'In review by host',
		photoVariant: 'tash',
	},
];

export const MIN_PEOPLE_INTRO_LENGTH = 100;
