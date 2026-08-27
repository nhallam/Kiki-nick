/**
 * A confirmed match, opened from the Matches card on either phone: the two
 * swappers together up top, then a vertical timeline of everything that
 * happens around the stay — paperwork, payments, the stay itself, and the
 * condition photos that bookend it.
 */
import React from 'react';

import { LISTINGS } from '../data';
import { Avatar, IconCheck, IconChevronLeft, StatusBar } from '../ui';
import { useSwapState } from '../store';
import { REQUEST_PREVIEWS } from './HostRequest';

interface TimelineItem {
	title: string;
	sub: string;
	done: boolean;
}

export function MatchDetailScreen({ onBack }: { onBack: () => void }) {
	const swap = useSwapState();
	const guest = 'Melissa';
	const preview = REQUEST_PREVIEWS[guest];
	const listing = LISTINGS.find((l) => l.listerName === 'Ryan')!;
	const rentTotal = preview.nights * listing.nightlyRate;

	const items: TimelineItem[] = [
		{
			title: 'Rental agreement',
			sub: `Signed by ${guest} and Ryan`,
			done: swap.guestSigned && swap.hostSigned,
		},
		{
			title: 'Deposit paid',
			sub: `£${listing.securityDeposit} held by Kiki`,
			done: swap.depositPaid,
		},
		{
			title: 'Rent paid',
			sub: `£${rentTotal} · paid to Ryan 3 days after move-in`,
			done: swap.rentPaid,
		},
		{ title: 'Move-in', sub: 'Wednesday 26 Aug', done: false },
		{ title: 'Move-out', sub: 'Saturday 29 Aug', done: false },
		{
			title: 'Condition photos · before',
			sub: `Taken when ${guest} moves in`,
			done: false,
		},
		{
			title: 'Condition photos · after',
			sub: `Taken when ${guest} moves out`,
			done: false,
		},
	];

	return (
		<div className="screen">
			<StatusBar time="12:13" />
			<div className="form-header review-head with-back">
				<button className="icon-btn review-back" onClick={onBack} aria-label="Back">
					<IconChevronLeft size={26} />
				</button>
				<span className="match-head-title">Match</span>
				<span style={{ width: 44 }} />
			</div>

			<div className="screen-scroll">
				<div className="match-hero">
					<div className="match-avatars">
						{/* The stayer leads; the host peeks out from behind */}
						<span className="match-avatar front">
							<Avatar variant="melissa" size={88} flag="🇦🇺" />
						</span>
						<span className="match-avatar back">
							<Avatar variant="ryan" size={88} flag="🇳🇿" />
						</span>
					</div>
					<div className="match-dates">26 - 29 Aug · {preview.nights} nights</div>
					<div className="match-where">Melissa at Ryan's apartment</div>
				</div>

				<div className="timeline">
					{items.map((item, i) => (
						<div key={item.title} className="tl-item">
							{i < items.length - 1 && (
								<span
									className={`tl-line${item.done && items[i + 1].done ? ' done' : ''}`}
									aria-hidden
								/>
							)}
							<span className={`tl-dot${item.done ? ' done' : ''}`}>
								{item.done && <IconCheck size={13} />}
							</span>
							<span className="tl-body">
								<span className="tl-title">{item.title}</span>
								<span className="tl-sub">{item.sub}</span>
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
