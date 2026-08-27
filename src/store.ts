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
	/** Reserved checklist: has each party signed the rental agreement? */
	guestSigned: boolean;
	hostSigned: boolean;
	/** Reserved checklist: the stayer's payments (tappable in the demo) */
	depositPaid: boolean;
	rentPaid: boolean;
	/** Move-out condition photos Melissa uploaded (indices into her roll) */
	afterPhotos: number[];
}

const INITIAL_STATE: SwapState = {
	melissa: 'new',
	aisha: 'new',
	guestSigned: false,
	hostSigned: false,
	depositPaid: false,
	rentPaid: false,
	afterPhotos: [],
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

/** Request state for a guest by display name ('Melissa' / 'Aisha'). */
export const guestState = (swap: SwapState, guest: string): GuestRequestState =>
	guest === 'Melissa' ? swap.melissa : guest === 'Aisha' ? swap.aisha : 'new';

export function setGuestState(guest: string, s: GuestRequestState) {
	if (guest === 'Melissa') setSwapState({ melissa: s });
	else if (guest === 'Aisha') setSwapState({ aisha: s });
}
