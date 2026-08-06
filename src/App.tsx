/**
 * Prototype navigation state machine, mirroring the real routing:
 * Explore → Listing detail → booking form (modal) → Rank → Trips (+ success
 * sheet, keyed off the new request — same as the `nbr` param flow).
 */
import React, { useState } from 'react';

import { EXISTING_REQUESTS, LISTINGS, Listing, SentRequest } from './data';
import { BookingFormData } from './screens/BookingFlow';
import { ReviewRequestScreen } from './screens/ReviewRequest';
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
		// Sending goes straight to Trips + the success sheet; ranking is a
		// pull action afterwards via Reorder on the Trips screen.
		const all = [...EXISTING_REQUESTS, newRequest];
		setRoute({ name: 'trips', requests: all, showSuccess: true, newRequest });
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
			// The flow is its own page; the listing stays mounted underneath
			// purely so the push/pop slide reveals it during the transition.
			return (
				<>
					<ListingDetailScreen
						listing={route.listing}
						onBack={() => {}}
						onRequestToBook={() => {}}
					/>
					<ReviewRequestScreen
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
					mode="reorder"
					onSubmit={(ordered) =>
						setRoute({
							name: 'trips',
							requests: ordered,
							showSuccess: false,
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
					onReorder={() =>
						setRoute({
							name: 'rank',
							requests: route.requests,
							newRequest: route.newRequest,
						})
					}
				/>
			);
	}
}
