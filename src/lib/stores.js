import { writable } from 'svelte/store';

export const isPlaying = writable(false);
export const currentMood = writable(null);

// The currently playing song
export const currentSong = writable({
    title: "Sunday Evening Classical",
    artist: "SyncU Curated",
    coverArt: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=200&auto=format&fit=crop",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
});

// NEW: The Playlist Queue and our current position in it
export const playlistQueue = writable([]);
export const currentTrackIndex = writable(0);