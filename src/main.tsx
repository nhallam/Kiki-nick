/**
 * Matching-flow prototype: two phones side by side, guest and host, so
 * both halves of the match can be walked through together. Each phone is
 * its own independent app instance.
 */
import React, { useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { HOST_PROFILE, MY_PROFILE } from './data';
import { Avatar, SelfAvatarContext } from './ui';
import './styles.css';

// Natural size of the pair; the stage scales down to fit the window.
const DUO_W = 393 * 2 + 48 + 48; // phones + gap + breathing room
const DUO_H = 830 + 84; // phone + label row + breathing room

function DuoStage() {
	const [scale, setScale] = useState(1);
	const stageRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const fit = () => {
			const s = Math.min(
				1,
				(window.innerWidth - 16) / DUO_W,
				(window.innerHeight - 16) / DUO_H,
			);
			setScale(s);
		};
		fit();
		window.addEventListener('resize', fit);
		return () => window.removeEventListener('resize', fit);
	}, []);

	return (
		<div
			className="duo-viewport"
			style={{ width: DUO_W * scale, height: DUO_H * scale }}
		>
			<div
				ref={stageRef}
				className="duo"
				style={{ width: DUO_W, height: DUO_H, transform: `scale(${scale})` }}
			>
				<div className="duo-col">
					<div className="duo-label">
						<Avatar variant="melissa" size={30} />
						<span className="duo-role">Guest</span>
						<span className="duo-name">
							{MY_PROFILE.name} {MY_PROFILE.nationalityFlag}
						</span>
					</div>
					<div className="phone">
						<SelfAvatarContext.Provider value="melissa">
							<App persona="guest" />
						</SelfAvatarContext.Provider>
					</div>
				</div>
				<div className="duo-col">
					<div className="duo-label">
						<Avatar variant="ryan" size={30} />
						<span className="duo-role host">Host</span>
						<span className="duo-name">
							{HOST_PROFILE.name} {HOST_PROFILE.nationalityFlag}
						</span>
					</div>
					<div className="phone">
						<SelfAvatarContext.Provider value="ryan">
							<App persona="host" />
						</SelfAvatarContext.Provider>
					</div>
				</div>
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<DuoStage />
	</React.StrictMode>,
);
