/**
 * Cross-phone swap state for the matching prototype. Both App instances
 * (guest + host) share this module, so the host acting on a request is
 * reflected on the guest's phone immediately.
 */
import { useSyncExternalStore } from 'react';

export type GuestRequestState =
	| 'new'
	| 'offered'
	| 'reserved'
	| 'confirmed'
	| 'declined'
	/** The host's offer was pulled automatically: another guest accepted
	    an offer for the same dates first. */
	| 'revoked';

export interface SwapState {
	melissa: GuestRequestState;
	aisha: GuestRequestState;
	tash: GuestRequestState;
	priya: GuestRequestState;
	sara: GuestRequestState;
	marco: GuestRequestState;
	/** Reserved checklist: has each party signed the rental agreement? */
	guestSigned: boolean;
	hostSigned: boolean;
	/** Reserved checklist: the stayer's payments (tappable in the demo) */
	depositPaid: boolean;
	rentPaid: boolean;
	/** Monthly rent (stays over 30 nights): month 1 up front (rentPaid),
	    the remaining months evenly spaced — one flag per scheduled month. */
	rentSplit: boolean;
	rentSchedPaid: boolean[];
	/** Move-out condition photos Melissa uploaded (indices into her roll) */
	afterPhotos: number[];
	/** Payment-confirmation screenshots Melissa uploaded (index into her roll) */
	depositShot: number | null;
	rentShot: number | null;
	/** Epoch ms when the 48h completion window closes (set on reserve) */
	reservedDeadline: number | null;
	/** Once all steps are done, each party presses Confirm match; the match
	    is made when both have. */
	guestConfirmedMatch: boolean;
	hostConfirmedMatch: boolean;
	/** What the host sent when declining, kept per guest — the host can
	    always see back exactly what went out. */
	declines: Record<string, { category: string; note: string }>;
	/** Guests in the order their offers went out. The guest phone plays
	    the most recent outstanding offer, so the demo follows the host. */
	offeredOrder: string[];
}

const INITIAL_STATE: SwapState = {
	melissa: 'new',
	aisha: 'new',
	tash: 'new',
	priya: 'new',
	// Settled before the demo starts — their snapshots stay readable
	sara: 'declined',
	marco: 'declined',
	guestSigned: false,
	hostSigned: false,
	depositPaid: false,
	rentPaid: false,
	rentSplit: false,
	rentSchedPaid: [],
	afterPhotos: [],
	depositShot: null,
	rentShot: null,
	reservedDeadline: null,
	guestConfirmedMatch: false,
	hostConfirmedMatch: false,
	declines: {
		Sara: { category: 'The dates are no longer available', note: '' },
		Marco: {
			category: 'Not the right fit for this stay',
			note: 'Sorry Marco, another couple asked for almost the same dates just before you.',
		},
	},
	offeredOrder: [],
};

let state: SwapState = INITIAL_STATE;

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
	listeners.add(l);
	return () => {
		listeners.delete(l);
	};
};

export const getSwapState = () => state;

export function setSwapState(patch: Partial<SwapState>) {
	state = { ...state, ...patch };
	listeners.forEach((l) => l());
}

/** Back to the demo's starting point (used by the Restart button). */
export function resetSwapState() {
	state = INITIAL_STATE;
	listeners.forEach((l) => l());
}

export function useSwapState(): SwapState {
	return useSyncExternalStore(subscribe, getSwapState);
}

/** Guests the host can act on, keyed by display name. */
const GUEST_KEYS: Record<
	string,
	'melissa' | 'aisha' | 'tash' | 'priya' | 'sara' | 'marco'
> = {
	Melissa: 'melissa',
	Aisha: 'aisha',
	Tash: 'tash',
	Priya: 'priya',
	Sara: 'sara',
	Marco: 'marco',
};

/** Request state for a guest by display name ('Melissa' / 'Aisha' / 'Tash'). */
export const guestState = (swap: SwapState, guest: string): GuestRequestState =>
	GUEST_KEYS[guest] ? swap[GUEST_KEYS[guest]] : 'new';

export function setGuestState(guest: string, s: GuestRequestState) {
	if (GUEST_KEYS[guest]) setSwapState({ [GUEST_KEYS[guest]]: s });
}

/** The guest whose journey the left phone is playing: whoever Ryan has
    reserved or matched; with several offers out, whoever he offered most
    recently; Melissa until he acts on someone. */
export const activeGuest = (swap: SwapState): string => {
	const settled = ['Melissa', 'Aisha', 'Tash', 'Priya'].find((g) => {
		const s = guestState(swap, g);
		return s === 'reserved' || s === 'confirmed';
	});
	if (settled) return settled;
	const offered = [...swap.offeredOrder]
		.reverse()
		.find((g) => guestState(swap, g) === 'offered');
	return offered ?? 'Melissa';
};

/** Declining sends the guest a reason (category + optional note) and
    keeps a copy for the host's records. */
export function declineGuest(guest: string, category: string, note: string) {
	setGuestState(guest, 'declined');
	setSwapState({
		declines: { ...state.declines, [guest]: { category, note } },
	});
}

/** Two-step consent: the host offers; nothing is reserved yet. The host
    can have several offers out for the same trip at once. */
export function sendOffer(guest: string) {
	if (!GUEST_KEYS[guest]) return;
	setSwapState({
		[GUEST_KEYS[guest]]: 'offered',
		offeredOrder: [
			...state.offeredOrder.filter((g) => g !== guest),
			guest,
		],
	});
}

/** The guest accepting the offer starts the 48-hour completion window.
    First to accept wins: every other outstanding offer on the same dates
    (`alsoRevoke`, computed by the caller from the date ranges) is revoked. */
export function reserveGuest(guest: string, alsoRevoke: string[] = []) {
	if (!GUEST_KEYS[guest]) return;
	const patch: Partial<SwapState> = {
		// Start a touch under 48h so the countdown reads "47:59:xx" immediately
		reservedDeadline: Date.now() + 48 * 3600_000 - 45_000,
	};
	patch[GUEST_KEYS[guest]] = 'reserved';
	for (const g of alsoRevoke) {
		if (GUEST_KEYS[g] && state[GUEST_KEYS[g]] === 'offered')
			patch[GUEST_KEYS[g]] = 'revoked';
	}
	setSwapState(patch);
}

/** Either party backing out during the window: the reservation unwinds and
    the request returns to the host's inbox (keeps the demo re-runnable).
    Offers that were revoked when this guest accepted come back too. */
export function withdrawReservation(guest: string) {
	setGuestState(guest, 'new');
	for (const g of Object.keys(GUEST_KEYS)) {
		if (state[GUEST_KEYS[g]] === 'revoked') setGuestState(g, 'new');
	}
	setSwapState({
		guestSigned: false,
		hostSigned: false,
		depositPaid: false,
		rentPaid: false,
		rentSplit: false,
		rentSchedPaid: [],
		depositShot: null,
		rentShot: null,
		reservedDeadline: null,
		guestConfirmedMatch: false,
		hostConfirmedMatch: false,
	});
}
