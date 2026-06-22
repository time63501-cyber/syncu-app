import { writable } from 'svelte/store';

export type PlaylistItem = {
	title: string;
	artist?: string;
	image: string;
	audioUrl: string;
	context?: string;
};

export type CurrentSong = {
	title: string;
	artist: string;
	coverArt: string;
	audioUrl: string;
};

export const isPlaying = writable(false);
export const currentMood = writable<string | null>(null);

export const currentSong = writable<CurrentSong>({
	title: 'Sunday Evening Classical',
	artist: 'SyncU Curated',
	coverArt: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=200&auto=format&fit=crop',
	audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
});

export const playlistQueue = writable<PlaylistItem[]>([]);
export const currentTrackIndex = writable(0);
