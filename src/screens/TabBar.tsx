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
}: {
	active: 'community' | 'explore' | 'trips' | 'notifications' | 'profile';
	notificationCount?: number;
}) {
	const item = (
		key: typeof active,
		label: string,
		icon: React.ReactNode,
		badge?: number,
	) => (
		<span className={`tab-item${active === key ? ' active' : ''}`}>
			{badge ? <span className="badge">{badge}</span> : null}
			{icon}
			{label}
		</span>
	);

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
