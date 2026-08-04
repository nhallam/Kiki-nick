/**
 * Kiki design tokens, ported 1:1 from the real app:
 * - packages/ui/general/src/tokens.ts (@kiki/ui-general)
 * - apps/mobile-app/theme/theme.ts (COLORS / SHADOWS)
 * Keep values identical to the source so the prototype stays on-brand.
 */

export const tokens = {
	color: {
		primary: {
			main: '#20A598',
			light: '#A9D4D0',
			dark: '#157A70',
			alt: '#6BDDCA',
			tint: '#E1FBF8',
			contrastText: '#FFFFFF',
		},
		input: {
			default: '#f1f1f1',
			alt: '#f6f6f6',
		},
	},
	font: {
		family: "'Inter', -apple-system, 'Segoe UI', 'Helvetica Neue', sans-serif",
	},
} as const;

export const COLORS = {
	teal: '#14B8A6',
	primary: tokens.color.primary.main,
	dark: '#1F2937',
	gray: '#9CA3AF',
	pillGray: '#5F5F61',
	lightGray: '#F6F6F6',
	white: '#FFFFFF',
	black: '#111827',
	border: '#e5e7eb',
	cardBorder: 'rgba(0, 0, 0, 0.14)',
	borderMediumGray: '#d1d5db',
	mintBackground: '#f0fdf9',
	borderLight: '#eee',
	inputBackground: '#f1f1f1',
	skeleton: '#f0f0f0',
	subtleBackground: '#f5f5f5',
	cardBackground: '#f9f9f9',
	danger: '#f44336',
	disabled: '#ccc',
	subtleText: '#6E7675',
	mutedText: '#a9b6b5',
	bodyText: '#3F3F3F',
	starGold: '#FFB800',
	heart: '#ef4444',
	heartVivid: '#FF0000',
	overlay: 'rgba(0,0,0,0.35)',
	overlayMedium: 'rgba(0,0,0,0.5)',
	overlayCard: 'rgba(80, 80, 80, 0.85)',
	overlayWhite: 'rgba(255, 255, 255, 0.84)',
	socialProofOverlay: 'rgba(167, 205, 201, 0.88)',
	primaryTint: 'rgba(32,165,152,0.1)',
	primaryTintStrong: 'rgba(32,165,152,0.2)',
	primaryLight: '#e8f7f6',
	scheduleTrack: tokens.color.primary.light,
	scheduleBlockBackground: 'rgba(169, 212, 208, 0.5)',
	primaryDark: '#0F6E56',
	transparent: 'transparent',
	borderMedium: '#ddd',
	disabledBackground: '#e0e0e0',
	disabledText: '#9e9e9e',
	info: '#0284C7',
	infoBackground: '#E3F2FD',
	success: '#16A34A',
	error: '#D32F2F',
	errorLight: '#fef2f2',
} as const;

export const SHADOWS = {
	soft: '0 0 10px rgba(0,0,0,0.1)',
	card: '0 2px 7px rgba(163,163,163,0.25)',
} as const;
