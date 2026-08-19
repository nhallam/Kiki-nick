import React from 'react';

import {
	Avatar,
	IconBell,
	IconCalendarDots,
	IconPeople,
	IconSearch,
} from '../ui';

export function TabBar({
	active,
	notificationCount = 0,
	onNavigate,
}: {
	active: 'community' | 'explore' | 'trips' | 'notifications' | 'profile';
	notificationCount?: number;
	/** Tabs that navigate; the rest stay decorative. */
	onNavigate?: (tab: 'explore' | 'trips') => void;
}) {
	const item = (
		key: typeof active,
		label: string,
		icon: React.ReactNode,
		badge?: number,
	) => {
		const navigable =
			onNavigate && (key === 'explore' || key === 'trips') && key !== active;
		const inner = (
			<>
				{badge ? <span className="badge">{badge}</span> : null}
				{icon}
				{label}
			</>
		);
		return navigable ? (
			<button
				className="tab-item"
				onClick={() => onNavigate(key as 'explore' | 'trips')}
			>
				{inner}
			</button>
		) : (
			<span className={`tab-item${active === key ? ' active' : ''}`}>
				{inner}
			</span>
		);
	};

	return (
		<div className="tab-bar">
			{item('community', 'Community', <IconPeople size={26} />)}
			{item('explore', 'Explore', <IconSearch size={26} />)}
			{item('trips', 'Trips', <IconCalendarDots size={26} />)}
			{item(
				'notifications',
				'Notificatio...',
				<IconBell size={26} />,
				notificationCount,
			)}
			{item('profile', 'Profile', <Avatar variant="me" size={26} />)}
		</div>
	);
}
