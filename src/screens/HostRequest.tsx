/**
 * Host's view of an incoming booking request — Melissa's request for
 * Ryan's August window, laid out with the same summary-card UI as the
 * guest-side booking request (2.4).
 */
import React from 'react';

import { LISTINGS, MY_PROFILE } from '../data';
import { Avatar, IconChevronLeft, StatusBar } from '../ui';
import { ReviewSummaryCard } from './ReviewRequest';

const INTRO =
	"Hi Ryan! I'm Melissa, a marketing manager from Sydney over in London for a work sprint. I'm tidy, quiet, and out most of the day — your balcony sold me. Happy to answer anything before you decide.";
const QUESTIONS =
	'Is it okay to use the balcony in the evenings, and is there somewhere to lock a bike?';

export function HostRequestScreen({ onBack }: { onBack: () => void }) {
	const listing = LISTINGS.find((l) => l.listerName === 'Ryan')!;
	const nights = 3;
	const rentTotal = nights * listing.nightlyRate;
	const total = rentTotal + listing.securityDeposit;

	return (
		<div className="screen">
			<StatusBar time="12:13" />
			<div className="form-header review-head with-back">
				<button className="icon-btn review-back" onClick={onBack} aria-label="Back">
					<IconChevronLeft size={26} />
				</button>
				<span className="review-head-titles">
					<span className="review-head-title">Booking request</span>
				</span>
				{/* mirrors the flow header's right slot so the title centres */}
				<span style={{ width: 44 }} />
			</div>

			<div className="form-content" style={{ paddingTop: 16 }}>
				{/* Who it's from */}
				<div className="profile-card">
					<Avatar variant="melissa" size={44} flag={MY_PROFILE.nationalityFlag} />
					<span className="info">
						<span className="name-row">
							{MY_PROFILE.name} <span>{MY_PROFILE.nationalityFlag}</span>
						</span>
						<span className="subtitle">
							{MY_PROFILE.occupation}, {MY_PROFILE.age}
						</span>
					</span>
				</div>

				<ReviewSummaryCard
					listing={listing}
					hasDates
					datesValue={`26th Aug – 29th Aug 2026 · ${nights} nights`}
					guestsLabel="Just Melissa"
					nights={nights}
					rentTotal={rentTotal}
					total={total}
					intro={INTRO}
					questions={QUESTIONS}
				/>
			</div>
		</div>
	);
}
