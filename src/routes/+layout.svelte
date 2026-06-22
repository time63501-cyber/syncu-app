<script>
	import '../app.css';
    import { isPlaying, currentSong, playlistQueue, currentTrackIndex } from '$lib/stores';
    import { NativeAudio } from '@capgo/native-audio';
    import { MediaSession } from '@capgo/capacitor-media-session';
    import { onDestroy } from 'svelte';
    import { Capacitor } from '@capacitor/core';
    import { page } from '$app/stores'; // <-- ADD THIS

	let { children } = $props();

	let currentTime = $state(0);
	let duration = $state(0);
	let isFullScreen = $state(false);
	let timeInterval;

	// 1. Initialize the Native Plugin
	$effect(() => {
    if (Capacitor.isNativePlatform()) {
        const initAudio = async () => {
            await NativeAudio.configure({ showNotification: true, backgroundPlayback: true });
        };
        initAudio();
    }
});

	// 2. The Core Playback Engine (No TS Types here!)
	async function playNativeTrack(track) {
		if (!track || !track.audioUrl) return;

		try {
			await NativeAudio.stop({ assetId: 'currentTrack' });
		} catch (e) { /* Ignore */ }

		try {
			await NativeAudio.preload({
				assetId: 'currentTrack',
				assetPath: track.audioUrl,
				isUrl: true, 
				notificationMetadata: {
					title: track.title,
					artist: track.artist,
					artworkUrl: track.image
				}
			});

			await NativeAudio.play({ assetId: 'currentTrack' });
			
			// Get duration once it's loaded
			const dur = await NativeAudio.getDuration({ assetId: 'currentTrack' });
			duration = dur.duration;
			$isPlaying = true;
			
			startTrackingTime();
		} catch (error) {
			console.error("Native Playback Error:", error);
		}
	}

	// 3. Watch for Song Changes
	$effect(() => {
		if ($currentSong) {
			playNativeTrack($currentSong);
		}
	});

	// 4. Progress Bar Syncing
	function startTrackingTime() {
		clearInterval(timeInterval);
		timeInterval = setInterval(async () => {
			if ($isPlaying) {
				try {
					const time = await NativeAudio.getCurrentTime({ assetId: 'currentTrack' });
					currentTime = time.currentTime;
					
					// Auto-play next if song ends (assuming within 1 sec of end)
					if (duration > 0 && currentTime >= duration - 1) {
						playNext();
					}
				} catch (e) { /* Ignore */ }
			}
		}, 1000);
	}

	onDestroy(() => {
		clearInterval(timeInterval);
	});

	// 5. Rewired UI Controls (No TS Types!)
	async function togglePlay(e) {
		if (e) e.stopPropagation();
		
		try {
			if ($isPlaying) {
				await NativeAudio.pause({ assetId: 'currentTrack' });
			} else {
				await NativeAudio.play({ assetId: 'currentTrack' });
			}
			$isPlaying = !$isPlaying;
		} catch (error) {
			console.error("Toggle Error", error);
		}
	}

	async function skipTime(seconds, e) {
		if (e) e.stopPropagation();
		try {
			const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
			// Fixed to setCurrentTime instead of seek
			await NativeAudio.setCurrentTime({ assetId: 'currentTrack', time: newTime });
			currentTime = newTime;
		} catch (error) {
			console.error("Seek Error", error);
		}
	}

	function playNext(e) {
		if (e) e.stopPropagation();
		if ($playlistQueue && $playlistQueue.length > 0) {
			let nextIndex = $currentTrackIndex + 1;
			if (nextIndex >= $playlistQueue.length) nextIndex = 0;

			$currentTrackIndex = nextIndex;
			let nextTrack = $playlistQueue[nextIndex];

			$currentSong = {
				title: nextTrack.title,
				artist: nextTrack.artist || 'SyncU Curated',
				coverArt: nextTrack.image,
				audioUrl: nextTrack.audioUrl
			};
		}
	}

	function playPrevious(e) {
		if (e) e.stopPropagation();
		if ($playlistQueue && $playlistQueue.length > 0) {
			if (currentTime > 3) {
				skipTime(-currentTime); // Seek to start
				return;
			}

			let prevIndex = $currentTrackIndex - 1;
			if (prevIndex < 0) prevIndex = $playlistQueue.length - 1;

			$currentTrackIndex = prevIndex;
			let prevTrack = $playlistQueue[prevIndex];

			$currentSong = {
				title: prevTrack.title,
				artist: prevTrack.artist || 'SyncU Curated',
				coverArt: prevTrack.image,
				audioUrl: prevTrack.audioUrl
			};
		}
	}

	function formatTime(seconds) {
		if (isNaN(seconds)) return '0:00';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s < 10 ? '0' : ''}${s}`;
	}
</script>

<div class="h-[100dvh] w-full flex flex-col relative bg-zinc-950 text-zinc-50 antialiased selection:bg-zinc-800">
	<main class="flex-1 overflow-y-auto pb-40 no-scrollbar"> {@render children()}
	</main>

	<div
		class="fixed bottom-[5.5rem] left-4 right-4 h-16 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/60 rounded-xl flex items-center justify-between px-4 shadow-2xl z-40 transition-transform cursor-pointer hover:bg-zinc-800/80 overflow-hidden"
		role="button"
		tabindex="0"
		onclick={() => (isFullScreen = true)}
		onkeydown={(e) => e.key === 'Enter' && (isFullScreen = true)}
	>
		<div class="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-800">
			<div class="h-full bg-white transition-all duration-75 ease-linear" style="width: {Math.min((currentTime / duration) * 100 || 0, 100)}%"></div>
		</div>

		<div class="flex items-center gap-3 w-7/12 min-w-0">
			<img src={$currentSong?.coverArt} alt="Album Art" class="w-10 h-10 rounded-md shadow-md object-cover" />
			<div class="flex flex-col min-w-0">
				<span class="text-sm font-semibold text-white truncate">{$currentSong?.title}</span>
				<span class="text-xs text-zinc-400 truncate">{$currentSong?.artist}</span>
			</div>
		</div>

		<div class="flex items-center justify-end gap-3 w-5/12">
			<button onclick={togglePlay} aria-label={$isPlaying ? 'Pause' : 'Play'} class="p-2 text-white active:scale-95 transition-all">
				{#if $isPlaying}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 fill-current translate-x-[1px]" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
				{/if}
			</button>
		</div>
	</div>

	<nav class="fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-900 flex items-center justify-around px-2 z-50 pb-2">
		<a href="/" class="flex flex-col items-center gap-1.5 p-2 transition-colors {$page.url.pathname === '/' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="{$page.url.pathname === '/' ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="{$page.url.pathname === '/' ? '0' : '1.5'}">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
			</svg>
			<span class="text-[10px] font-medium tracking-wide">Home</span>
		</a>

		<a href="/mood" class="flex flex-col items-center gap-1.5 p-2 transition-colors {$page.url.pathname === '/mood' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="{$page.url.pathname === '/mood' ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="{$page.url.pathname === '/mood' ? '0' : '1.5'}">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
			</svg>
			<span class="text-[10px] font-medium tracking-wide">Mood Vault</span>
		</a>

		<button class="flex flex-col items-center gap-1.5 p-2 transition-colors text-zinc-600 cursor-not-allowed">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<span class="text-[10px] font-medium tracking-wide">Search</span>
		</button>
	</nav>
</div>

<div
	class={ "fixed inset-0 z-[100] bg-zinc-950 flex flex-col overflow-y-auto overscroll-contain no-scrollbar transition-transform duration-500 ease-in-out " + (isFullScreen ? 'translate-y-0' : 'translate-y-full') }
>
	<div class="sticky top-0 z-10 flex flex-shrink-0 items-center justify-between bg-zinc-950/90 px-6 pt-12 pb-4 backdrop-blur">
		<button onclick={() => (isFullScreen = false)} aria-label="Close Full Screen" class="p-2 -ml-2 text-zinc-400 hover:text-white transition rounded-full hover:bg-zinc-800/50">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
		</button>
		<span class="text-xs font-bold tracking-widest text-zinc-500 uppercase">Now Playing</span>
		<div class="w-8"></div>
	</div>

	<div class="flex min-h-fit flex-col items-center px-8 pt-4 pb-14 sm:flex-1 sm:justify-center">
		<img src={$currentSong?.coverArt} alt="Album Art" class="w-full max-w-[350px] aspect-square rounded-3xl shadow-2xl object-cover mb-10" />

		<div class="w-full max-w-[350px] flex flex-col items-start mb-7">
			<h2 class="text-3xl font-bold text-white truncate w-full">{$currentSong?.title}</h2>
			<p class="text-lg text-zinc-400 truncate w-full mt-1">{$currentSong?.artist}</p>
		</div>

		<div class="w-full max-w-[350px] mb-8">
			<div class="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-3">
				<div class="h-full bg-white rounded-full relative" style="width: {Math.min((currentTime / duration) * 100 || 0, 100)}%"></div>
			</div>
			<div class="flex justify-between text-xs text-zinc-500 font-medium">
				<span>{formatTime(currentTime)}</span>
				<span>{formatTime(duration)}</span>
			</div>
		</div>

		<div class="w-full max-w-[350px] flex flex-shrink-0 items-center justify-between">
			<button onclick={(e) => skipTime(-5, e)} aria-label="Rewind 5 Seconds" class="text-zinc-400 hover:text-white transition active:scale-90">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
			</button>

			<button onclick={(e) => playPrevious(e)} aria-label="Previous Track" class="text-zinc-100 hover:text-zinc-300 transition active:scale-90">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
			</button>

			<button onclick={togglePlay} aria-label={$isPlaying ? 'Pause' : 'Play'} class="w-20 h-20 flex items-center justify-center rounded-full bg-white text-black active:scale-95 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]">
				{#if $isPlaying}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 translate-x-[2px]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
				{/if}
			</button>

			<button onclick={(e) => playNext(e)} aria-label="Next Track" class="text-zinc-100 hover:text-zinc-300 transition active:scale-90">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
			</button>

			<button onclick={(e) => skipTime(5, e)} aria-label="Fast Forward 5 Seconds" class="text-zinc-400 hover:text-white transition active:scale-90">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" /></svg>
			</button>
		</div>
	</div>
</div>

<style>
	:global(html), :global(body) { margin: 0; padding: 0; background-color: #09090b; }
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>