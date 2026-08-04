import React from 'react';

import { LISTINGS, Listing } from '../data';
import {
	Avatar,
	IconBell,
	IconHeart,
	IconPin,
	IconSearch,
	RoomPhoto,
	StatusBar,
} from '../ui';
import { TabBar } from './TabBar';

function ListingCard({
	listing,
	onOpen,
}: {
	listing: Listing;
	onOpen: () => void;
}) {
	const dates =
		listing.id === 1 ? '20 Aug - 25 Aug' : '16 Aug - 13 Sep';
	return (
		<button className="listing-card" onClick={onOpen}>
			<div className="top">
				<Avatar
					variant={listing.photoVariant === 'ieva' ? 'ieva' : 'jake'}
					initial={listing.listerName[0]}
					size={92}
					flag={listing.nationalityFlag}
				/>
				<div className="headline">
					<h3>{listing.title}</h3>
					<span className="loc">
						<IconPin size={18} /> {listing.area}, {listing.city}
					</span>
					<span className="date-chip">{dates}</span>
				</div>
				<IconHeart size={28} color="#ef4444" />
			</div>
			<div className="photo">
				<RoomPhoto variant={listing.photoVariant} />
				<span className="photo-tag">
					{listing.roomType} <span className="sep">|</span> £{listing.nightlyRate} / night
				</span>
				<span className="fav-note">
					<IconHeart size={16} color="#ef4444" filled /> by {listing.favouritedBy} person
				</span>
				<span className="carousel-dots">
					{[0, 1, 2, 3, 4].map((i) => (
						<i key={i} className={i === 0 ? 'active' : ''} />
					))}
				</span>
			</div>
			<span className="vouched">
				<Avatar variant="sara" initial="S" size={26} /> Vouched for by {listing.vouchedForBy}
			</span>
		</button>
	);
}

export function ExploreScreen({
	onOpenListing,
}: {
	onOpenListing: (listing: Listing) => void;
}) {
	return (
		<div className="screen">
			<StatusBar time="12:11" />
			<div className="explore-header">
				<div className="explore-title">Explore</div>
				<div className="search-row">
					<span className="search-input">
						<IconSearch size={20} /> Search by dates or duration
					</span>
					<button className="filters-btn">Filters</button>
				</div>
				<div className="pill-row">
					<span className="pill">
						<IconBell size={18} /> Search Notifications
					</span>
					<span className="pill">
						<IconHeart size={18} color="#ef4444" /> Favourites
					</span>
				</div>
			</div>
			<div className="screen-scroll">
				<div className="added-banner">🏠 +24 Kiki's added today!</div>
				{LISTINGS.map((l) => (
					<ListingCard key={l.id} listing={l} onOpen={() => onOpenListing(l)} />
				))}
			</div>
			<TabBar active="explore" />
		</div>
	);
}
