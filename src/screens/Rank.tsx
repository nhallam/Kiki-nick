/**
 * "Rank this Booking Request" — port of ReorderRequests.tsx in new-request
 * mode (progress bar at 90%, Submit CTA). Drag to reorder via pointer events.
 */
import React, { useRef, useState } from 'react';

import { SentRequest } from '../data';
import { IconDrag, IconInfo, RoomPhoto, StatusBar } from '../ui';

export function TripRequestCard({ request }: { request: SentRequest }) {
	return (
		<div className="trip-card">
			<div className="photo">
				<RoomPhoto variant={request.photoVariant} />
			</div>
			<div className="body">
				<div className="title">{request.title}</div>
				<div className="meta">
					{request.dates} <span className="sep">|</span> £{request.nightlyRate}{' '}
					p/night
				</div>
				<span className="status-chip">{request.status}</span>
			</div>
		</div>
	);
}

const ROW_HEIGHT = 118 + 12; // card min-height + gap, for drag math

export function RankScreen({
	requests,
	onSubmit,
}: {
	requests: SentRequest[];
	onSubmit: (ordered: SentRequest[]) => void;
}) {
	const [order, setOrder] = useState(requests.map((r) => r.id));
	const [dragId, setDragId] = useState<number | null>(null);
	const [dragOffset, setDragOffset] = useState(0);
	const startY = useRef(0);

	const byId = (id: number) => requests.find((r) => r.id === id)!;

	const handlePointerDown = (id: number) => (e: React.PointerEvent) => {
		(e.target as HTMLElement).setPointerCapture?.(e.pointerId);
		setDragId(id);
		startY.current = e.clientY;
		setDragOffset(0);
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (dragId === null) return;
		const offset = e.clientY - startY.current;
		setDragOffset(offset);
		const fromIndex = order.indexOf(dragId);
		const shift = Math.round(offset / ROW_HEIGHT);
		const toIndex = Math.max(0, Math.min(order.length - 1, fromIndex + shift));
		if (toIndex !== fromIndex) {
			const next = [...order];
			next.splice(fromIndex, 1);
			next.splice(toIndex, 0, dragId);
			setOrder(next);
			startY.current = e.clientY;
			setDragOffset(0);
		}
	};

	const endDrag = () => {
		setDragId(null);
		setDragOffset(0);
	};

	return (
		<div className="screen">
			<StatusBar />
			<div className="progress-container" style={{ paddingBottom: 4 }}>
				<div className="progress-track">
					<div className="progress-fill" style={{ width: '90%' }} />
				</div>
			</div>

			<div className="screen-scroll" style={{ padding: '24px 24px 32px' }}>
				<div className="rank-title">Rank this Booking Request</div>
				<div className="instruction-row">
					<span className="instruction">
						Hold and drag to rank it against your other requests
					</span>
					<IconInfo size={22} color="#9CA3AF" />
				</div>
				<div className="rank-explainer">
					Your #1 request is prioritised — if two of your requests get
					accepted, we'll book the higher-ranked one.
				</div>

				<div className="rank-list">
					{order.map((id, index) => (
						<div
							key={id}
							className={`rank-row${dragId === id ? ' dragging' : ''}`}
							style={
								dragId === id ? { transform: `translateY(${dragOffset}px)` } : undefined
							}
							onPointerDown={handlePointerDown(id)}
							onPointerMove={handlePointerMove}
							onPointerUp={endDrag}
							onPointerCancel={endDrag}
						>
							<span className={`rank-num${index === 0 ? ' top' : ''}`}>
								#{index + 1}
							</span>
							<span className="drag-handle">
								<IconDrag size={22} />
							</span>
							<TripRequestCard request={byId(id)} />
						</div>
					))}
				</div>
			</div>

			<div className="form-footer">
				<button
					className="btn-primary square"
					onClick={() => onSubmit(order.map(byId))}
				>
					Submit
				</button>
			</div>
		</div>
	);
}
