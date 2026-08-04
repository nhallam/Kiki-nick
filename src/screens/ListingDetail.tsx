import React from 'react';

import { Listing } from '../data';
import {
	Avatar,
	IconArrowLeft,
	IconDotsVertical,
	IconHeart,
	IconHome,
	IconPerson,
	IconShare,
	RoomPhoto,
	StatusBar,
} from '../ui';

export function ListingDetailScreen({
	listing,
	onBack,
	onRequestToBook,
}: {
	listing: Listing;
	onBack: () => void;
	onRequestToBook: () => void;
}) {
	return (
		<div className="screen">
			<StatusBar />
			<div className="detail-header">
				<button className="icon-btn" onClick={onBack} aria-label="Back">
					<IconArrowLeft size={26} />
				</button>
				<div className="detail-host">
					<Avatar
						variant={listing.photoVariant === 'ieva' ? 'ieva' : 'jake'}
						initial={listing.listerName[0]}
						size={76}
						flag={listing.nationalityFlag}
					/>
					<span className="name">{listing.listerName}</span>
					<span className="role">Host</span>
				</div>
				<div className="header-actions">
					<button className="icon-btn" aria-label="Share">
						<IconShare size={23} />
					</button>
					<button className="icon-btn" aria-label="Favourite">
						<IconHeart size={25} color="#FF0000" filled />
					</button>
					<button className="icon-btn" aria-label="More">
						<IconDotsVertical size={22} />
					</button>
				</div>
			</div>

			<div className="detail-tabs">
				<span className="detail-tab active">
					<IconHome size={20} /> Room
				</span>
				<span className="detail-tab">
					<IconPerson size={20} /> Profile
				</span>
			</div>

			<div className="screen-scroll" style={{ paddingBottom: 92 }}>
				<div className="detail-photo">
					<RoomPhoto variant={listing.photoVariant} />
					<span className="carousel-dots">
						{Array.from({ length: 12 }).map((_, i) => (
							<i key={i} className={i === 0 ? 'active' : ''} />
						))}
					</span>
				</div>

				<div className="detail-section">
					<h2>Description</h2>
					<p className="body-text">
						{listing.description.slice(0, 208)}...
					</p>
					<span className="read-more">Read more</span>
				</div>

				<div className="detail-section" style={{ paddingTop: 0 }}>
					<h2>Available Dates</h2>
					<div className="avail-chip">
						<span>21 Aug 2026 → 26 Aug 2026</span>
						<span style={{ color: 'var(--primary)' }}>5 nights</span>
					</div>
				</div>
			</div>

			<div className="listing-cta-bar">
				<span className="info">
					<Avatar
						variant={listing.photoVariant === 'ieva' ? 'ieva' : 'jake'}
						initial={listing.listerName[0]}
						size={44}
						flag={listing.nationalityFlag}
					/>
					<span style={{ minWidth: 0 }}>
						<div className="title">{listing.title}</div>
						<div className="price">£{listing.nightlyRate} / night</div>
					</span>
				</span>
				<button className="cta-btn" onClick={onRequestToBook}>
					Request to book
				</button>
			</div>
		</div>
	);
}
