import React from 'react';

import {
	Listing,
	listingWindows,
	parseISODate,
	shortDate,
	windowNights,
} from '../data';
import {
	Avatar,
	IconArrowLeft,
	IconDotsVertical,
	IconHeart,
	IconShare,
	RoomPhoto,
	StatusBar,
} from '../ui';

const InstaIcon = () => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
	>
		<rect x="3" y="3" width="18" height="18" rx="5" />
		<circle cx="12" cy="12" r="4" />
		<circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
	</svg>
);

/**
 * Listing page as one scroll: photos, description, availability, then the
 * host's profile as its own section at the bottom — no Room/Profile tabs.
 */
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

			<div
				className="screen-scroll"
				style={{
					paddingBottom: 92,
					marginTop: 14,
					borderTop: '1px solid var(--border-light)',
				}}
			>
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
					<p className="body-text">{listing.description.slice(0, 208)}...</p>
					<span className="read-more">Read more</span>
				</div>

				<div className="detail-section" style={{ paddingTop: 0 }}>
					<h2>Available Dates</h2>
					{listingWindows(listing).map((w, i) => (
						<div className="avail-chip" key={i}>
							<span>
								{shortDate(parseISODate(w.start))} →{' '}
								{shortDate(parseISODate(w.end))} 2026
							</span>
							<span style={{ color: 'var(--primary)' }}>
								{windowNights(w)} nights
							</span>
						</div>
					))}
				</div>

				{/* Host profile — its own section instead of a separate tab. */}
				<div className="detail-section" style={{ paddingTop: 0 }}>
					<h2>About {listing.listerName}</h2>
					<div className="vouch-banner">
						<Avatar
							variant={listing.vouchedForBy === 'Sara' ? 'sara' : 'generic'}
							initial={listing.vouchedForBy[0]}
							size={34}
						/>
						Vouched for by {listing.vouchedForBy}
					</div>
					<div className="profile-grid">
						<div>
							<div className="profile-label">Age</div>
							<div className="profile-value">{listing.hostAge}</div>
						</div>
						<div>
							<div className="profile-label">Gender</div>
							<div className="profile-value">{listing.hostGender}</div>
						</div>
						<div>
							<div className="profile-label">Nationality</div>
							<div className="profile-value">
								{listing.nationalityFlag} {listing.hostNationality}
							</div>
						</div>
						<div>
							<div className="profile-label">Home town</div>
							<div className="profile-value">{listing.hostHometown}</div>
						</div>
						<div>
							<div className="profile-label">Job</div>
							<div className="profile-value">{listing.hostJob}</div>
						</div>
					</div>
					<div className="insta-heading">Instagram</div>
					<span className="insta-pill">
						<InstaIcon /> {listing.instagram}
					</span>
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
