/**
 * Cross-phone swap state for the matching prototype. Both App instances
 * (guest + host) share this module, so the host acting on a request is
 * reflected on the guest's phone immediately.
 */
import { useSyncExternalStore } from 'react';

export type GuestRequestState = 'new' | 'reserved' | 'confirmed' | 'declined';

export interface SwapState {
	melissa: GuestRequestState;
	aisha: GuestRequestState;
	tash: GuestRequestState;
	/** Reserved checklist: has each party signed the rental agreement? */
	guestSigned: boolean;
	hostSigned: boolean;
	/** Reserved checklist: the stayer's payments (tappable in the demo) */
	depositPaid: boolean;
	rentPaid: boolean;
	/** Rent in two parts (stay >1 month out): half now, half due 1 month
	    before move-in. rentPaid then means the first half. */
	rentSplit: boolean;
	rent2Paid: boolean;
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
}

const INITIAL_STATE: SwapState = {
	melissa: 'new',
	aisha: 'new',
	tash: 'new',
	guestSigned: false,
	hostSigned: false,
	depositPaid: false,
	rentPaid: false,
	rentSplit: false,
	rent2Paid: false,
	afterPhotos: [],
	depositShot: null,
	rentShot: null,
	reservedDeadline: null,
	guestConfirmedMatch: false,
	hostConfirmedMatch: false,
	declines: {},
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
const GUEST_KEYS: Record<string, 'melissa' | 'aisha' | 'tash'> = {
	Melissa: 'melissa',
	Aisha: 'aisha',
	Tash: 'tash',
};

/** Request state for a guest by display name ('Melissa' / 'Aisha' / 'Tash'). */
export const guestState = (swap: SwapState, guest: string): GuestRequestState =>
	GUEST_KEYS[guest] ? swap[GUEST_KEYS[guest]] : 'new';

export function setGuestState(guest: string, s: GuestRequestState) {
	if (GUEST_KEYS[guest]) setSwapState({ [GUEST_KEYS[guest]]: s });
}

/** The guest whose journey the left phone is playing: whoever Ryan has
    reserved or matched; Melissa until he acts on someone. */
export const activeGuest = (swap: SwapState): string =>
	['Melissa', 'Aisha', 'Tash'].find((g) => {
		const s = guestState(swap, g);
		return s === 'reserved' || s === 'confirmed';
	}) ?? 'Melissa';

/** Declining sends the guest a reason (category + optional note) and
    keeps a copy for the host's records. */
export function declineGuest(guest: string, category: string, note: string) {
	setGuestState(guest, 'declined');
	setSwapState({
		declines: { ...state.declines, [guest]: { category, note } },
	});
}

/** Accepting starts the 48-hour completion window. */
export function reserveGuest(guest: string) {
	setGuestState(guest, 'reserved');
	// Start a touch under 48h so the countdown reads "47:59:xx" immediately
	setSwapState({ reservedDeadline: Date.now() + 48 * 3600_000 - 45_000 });
}

/** Either party backing out during the window: the reservation unwinds and
    the request returns to the host's inbox (keeps the demo re-runnable). */
export function withdrawReservation(guest: string) {
	setGuestState(guest, 'new');
	setSwapState({
		guestSigned: false,
		hostSigned: false,
		depositPaid: false,
		rentPaid: false,
		rentSplit: false,
		rent2Paid: false,
		depositShot: null,
		rentShot: null,
		reservedDeadline: null,
		guestConfirmedMatch: false,
		hostConfirmedMatch: false,
	});
}
