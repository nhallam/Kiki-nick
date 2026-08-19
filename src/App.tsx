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
import { SentScreen } from './screens/Sent';
import { TripsScreen } from './screens/Trips';
import { HostRequestScreen } from './screens/HostRequest';

type Route =
	| { name: 'explore' }
	| { name: 'listing'; listing: Listing }
	| { name: 'booking'; listing: Listing }
	| { name: 'sent'; requests: SentRequest[]; newRequest: SentRequest; listerName: string }
	| { name: 'rank'; requests: SentRequest[]; newRequest: SentRequest }
	| { name: 'trips'; requests: SentRequest[]; showSuccess: boolean; newRequest: SentRequest }
	| { name: 'hostRequest' };

export default function App({ persona }: { persona?: 'guest' | 'host' }) {
	// The matching prototype starts both phones on Trips, each on its own
	// side of the swap; without a persona the app opens on Explore as usual.
	const [route, setRoute] = useState<Route>(() =>
		persona
			? {
					name: 'trips',
					requests: EXISTING_REQUESTS,
					showSuccess: false,
					newRequest: EXISTING_REQUESTS[0],
				}
			: { name: 'explore' },
	);

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
		// Sending lands on a simple full-screen confirmation; Done goes to
		// Trips, and ranking stays a pull action there via Reorder.
		const all = [...EXISTING_REQUESTS, newRequest];
		setRoute({
			name: 'sent',
			requests: all,
			newRequest,
			listerName: listing.listerName,
		});
	};

	// Bottom-bar navigation between the two working tabs.
	const tripsRoute = (): Route => ({
		name: 'trips',
		requests: EXISTING_REQUESTS,
		showSuccess: false,
		newRequest: EXISTING_REQUESTS[0],
	});
	const navigate = (tab: 'explore' | 'trips') =>
		setRoute(tab === 'explore' ? { name: 'explore' } : tripsRoute());

	switch (route.name) {
		case 'explore':
			return (
				<ExploreScreen
					onOpenListing={(listing) => setRoute({ name: 'listing', listing })}
					onNavigate={navigate}
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
		case 'sent':
			return (
				<SentScreen
					listerName={route.listerName}
					onDone={() =>
						setRoute({
							name: 'trips',
							requests: route.requests,
							showSuccess: false,
							newRequest: route.newRequest,
						})
					}
				/>
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
					initialTab={persona === 'host' ? 'hosting' : 'staying'}
					canHost={persona === 'host'}
					onNavigate={navigate}
					onOpenRequest={() => setRoute({ name: 'hostRequest' })}
				/>
			);
		case 'hostRequest':
			return <HostRequestScreen onBack={() => setRoute(tripsRoute())} />;
	}
}
