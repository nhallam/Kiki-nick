/**
 * Prototype navigation state machine, mirroring the real routing:
 * Explore → Listing detail → booking form (modal) → Rank → Trips (+ success
 * sheet, keyed off the new request — same as the `nbr` param flow).
 */
import React, { useState } from 'react';

import { EXISTING_REQUESTS, LISTINGS, Listing, SentRequest } from './data';
import { BookingFlowScreen, BookingFormData } from './screens/BookingFlow';
import { ExploreScreen } from './screens/Explore';
import { ListingDetailScreen } from './screens/ListingDetail';
import { RankScreen } from './screens/Rank';
import { TripsScreen } from './screens/Trips';

type Route =
	| { name: 'explore' }
	| { name: 'listing'; listing: Listing }
	| { name: 'booking'; listing: Listing }
	| { name: 'rank'; requests: SentRequest[]; newRequest: SentRequest }
	| { name: 'trips'; requests: SentRequest[]; showSuccess: boolean; newRequest: SentRequest };

export default function App() {
	const [route, setRoute] = useState<Route>({ name: 'explore' });

	const handleSubmitted = (listing: Listing, formData: BookingFormData) => {
		const shortDate = (d: Date) =>
			`${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`;
		const dates =
			formData.moveInDate && formData.moveOutDate
				? `${shortDate(formData.moveInDate)} - ${shortDate(formData.moveOutDate)}`
				: '';
		const newRequest: SentRequest = {
			id: Date.now(),
			title: `${listing.title} in ${listing.area}, ${listing.city}`,
			dates,
			nightlyRate: listing.nightlyRate,
			status: 'In review by host',
			photoVariant: listing.photoVariant,
		};
		// Match the real flow: rank the new request against other active ones
		// (skip straight to Trips + sheet when it's the only active request).
		const all = [...EXISTING_REQUESTS, newRequest];
		if (EXISTING_REQUESTS.length === 0) {
			setRoute({ name: 'trips', requests: all, showSuccess: true, newRequest });
		} else {
			setRoute({ name: 'rank', requests: all, newRequest });
		}
	};

	switch (route.name) {
		case 'explore':
			return (
				<ExploreScreen
					onOpenListing={(listing) => setRoute({ name: 'listing', listing })}
				/>
			);
		case 'listing':
			return (
				<ListingDetailScreen
					listing={route.listing}
					onBack={() => setRoute({ name: 'explore' })}
					onRequestToBook={() =>
						setRoute({ name: 'booking', listing: route.listing })
					}
				/>
			);
		case 'booking':
			return (
				<>
					<ListingDetailScreen
						listing={route.listing}
						onBack={() => {}}
						onRequestToBook={() => {}}
					/>
					<BookingFlowScreen
						listing={route.listing}
						onClose={() => setRoute({ name: 'listing', listing: route.listing })}
						onSubmitted={(formData) => handleSubmitted(route.listing, formData)}
					/>
				</>
			);
		case 'rank':
			return (
				<RankScreen
					requests={route.requests}
					onSubmit={(ordered) =>
						setRoute({
							name: 'trips',
							requests: ordered,
							showSuccess: true,
							newRequest: route.newRequest,
						})
					}
				/>
			);
		case 'trips':
			return (
				<TripsScreen
					requests={route.requests}
					showSuccessSheet={route.showSuccess}
					successListerName={
						route.newRequest.title.startsWith("Ieva") ? 'Ieva' : 'the host'
					}
					successPhotoVariant={route.newRequest.photoVariant}
					onDismissSuccess={() =>
						setRoute({ ...route, showSuccess: false })
					}
				/>
			);
	}
}
