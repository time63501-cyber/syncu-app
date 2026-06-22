<script lang="ts">
	import { onMount } from 'svelte';
	import { isPlaying, currentSong, playlistQueue, currentTrackIndex } from '$lib/stores';

	let currentAtmosphere = $state("Syncing with your environment...");
	let isLoading = $state(true);
	let categories = $state<any[]>([]); // Array of category rows (Trending, Vibe, Fresh Finds)

	// Ping Python for the default discovery dashboard
	async function fetchRecommendations() {
		isLoading = true;
		try {
			const response = await fetch('http://127.0.0.1:8000/api/recommend', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					user_id: "test_user_1",
					city: "Proddatur", 
					manual_mood: null // Home screen always requests the multi-row discovery array
				})
			});

			if (response.ok) {
				const data = await response.json();
				currentAtmosphere = data.atmosphere; 
				categories = data.categories; 
			}
		} catch (error) {
			console.error("Backend connection failed:", error);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		fetchRecommendations(); 
	});

	function playTrack(playlist: any, categoryTracks: any[]) {
		if (!playlist.is_available) {
			alert("This track is not yet hosted on the SyncU server.");
			return;
		}

		const availableTracks = categoryTracks.filter(t => t.is_available);
		const newIndex = availableTracks.findIndex(t => t.id === playlist.id);

		$playlistQueue = availableTracks;
		$currentTrackIndex = newIndex;
		
		$currentSong = {
			title: playlist.title,
			artist: playlist.artist || "SyncU Curated",
			coverArt: playlist.image,
			audioUrl: playlist.audioUrl
		};
		$isPlaying = true;
	}
</script>

<div class="px-6 py-8 pb-32">
	<header class="mb-10">
		<h1 class="text-4xl font-extrabold tracking-tight text-white mb-1">Good evening.</h1>
		<p class="text-sm font-medium text-zinc-400 flex items-center gap-2">
			{#if isLoading}
				<span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
			{/if}
			{currentAtmosphere}
		</p>
	</header>

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<p class="text-zinc-500 animate-pulse font-medium tracking-wide">Syncing Library...</p>
		</div>
	{:else}
		<div class="flex flex-col gap-10">
			{#each categories as category}
				<section>
					<h2 class="text-xl font-bold text-zinc-100 mb-6">{category.title}</h2>
					
					<div class="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 snap-x">
						{#each category.tracks as playlist}
							<div 
								class="group w-36 sm:w-40 flex-shrink-0 snap-start flex flex-col gap-2 {playlist.is_available ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}" 
								role="button"
								tabindex="0"
								onclick={() => playTrack(playlist, category.tracks)} 
								onkeydown={(e) => e.key === 'Enter' && playTrack(playlist, category.tracks)} 
							>
								<div class="relative w-full aspect-square rounded-xl overflow-hidden shadow-md bg-zinc-900">
									<img src={playlist.image} alt={playlist.title} class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
									
									{#if playlist.is_available}
										<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
											<button aria-label="Play {playlist.title}" class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:text-black transition-all text-white">
												<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 translate-x-[1px]" viewBox="0 0 24 24" fill="currentColor">
													<path d="M8 5v14l11-7z"/>
												</svg>
											</button>
										</div>
									{:else}
										<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
											<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
											</svg>
										</div>
									{/if}
								</div>
								
								<div class="flex flex-col">
									<div class="flex items-center gap-2">
										<span class="text-sm font-semibold text-zinc-100 truncate" title={playlist.title}>{@html playlist.title}</span>
										
										{#if playlist.is_available}
											<div class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] flex-shrink-0" title="Available on Server"></div>
										{/if}
									</div>
									<span class="text-[10px] font-medium text-zinc-400 mt-0.5 truncate" title={playlist.artist}>{@html playlist.artist}</span>
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>