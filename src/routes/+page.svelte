<script>
	import { onMount } from 'svelte';
    import { isPlaying, currentSong, currentMood, playlistQueue, currentTrackIndex } from '$lib/stores';
	
    // Use $state() for variables that update dynamically
	let greeting = $state("Hello");
	let timeOfDay = $state("morning");
	/** @type {import('$lib/stores').PlaylistItem[]} */
	let suggestions = $state([]);
	
	onMount(async () => {
		const hour = new Date().getHours();
		if (hour < 12) { greeting = "Good morning"; timeOfDay = "morning"; }
		else if (hour < 18) { greeting = "Good afternoon"; timeOfDay = "afternoon"; }
		else { greeting = "Good evening"; timeOfDay = "evening"; }

		// As soon as the app loads, ask Python for music!
		// For now, we will pass a default context. Later, we'll use the real weather/mood.
		await fetchRecommendations(timeOfDay, "Relaxing", "Bright");
	});

	// The Bridge: This function talks to your Python backend
	/**
	 * @param {string} time
	 * @param {string} activity
	 * @param {string} atmosphere
	 */
	async function fetchRecommendations(time, activity, atmosphere) {
		try {
			const response = await fetch("http://localhost:8000/api/recommend", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					time_of_day: time,
					activity: activity,
					atmosphere: atmosphere
				})
			});

			if (response.ok) {
				const data = await response.json();
				suggestions = data.playlist; // Update the UI with Python's data
			}
		} catch (error) {
			console.error("Brain disconnected! Is the Python server running?", error);
		}
	}

	// Keep your existing mood categories
	const moods = [
		{ id: 1, name: "Deep Focus", icon: "🧠" },
		{ id: 2, name: "Relax & Unwind", icon: "☕" },
		{ id: 3, name: "High Energy", icon: "⚡" },
		{ id: 4, name: "Late Night Drive", icon: "🌙" },
		{ id: 5, name: "Melancholy", icon: "🌧️" }
	];

	// 2. Update playTrack to accept the index and load the queue
	/**
	 * @param {import('$lib/stores').PlaylistItem} playlist
	 * @param {number} index
	 */
	function playTrack(playlist, index) {
		$playlistQueue = suggestions; // Load the whole grid into the queue
		$currentTrackIndex = index;   // Set our current position
		
		$currentSong = {
			title: playlist.title,
			artist: playlist.artist || "SyncU Curated",
			coverArt: playlist.image,
			audioUrl: playlist.audioUrl
		};
		$isPlaying = true;
	}

	/** @param {string} moodName */
	function selectMood(moodName) {
		$currentMood = moodName;
		
		// Map the UI mood to the backend activity to get fresh recommendations instantly
		let mappedActivity = "Relaxing";
		if (moodName === "Deep Focus") mappedActivity = "Deep Work";
		if (moodName === "High Energy" || moodName === "Late Night Drive") mappedActivity = "Moving";
		
		fetchRecommendations(timeOfDay, mappedActivity, "Bright");
	}
</script>

<div class="px-4 sm:px-6 pt-12 pb-8 animate-fade-in">
	
	<header class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-white">{greeting}.</h1>
			<p class="text-zinc-400 mt-1 text-sm">Syncing with your environment...</p>
		</div>
		
		<a href="/mood" aria-label="Open Mood Profiler" class="relative group">
			<div class="absolute -inset-1 bg-white/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition duration-300"></div>
			
			<button aria-label="Action" class="relative w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center group-hover:bg-zinc-700 transition active:scale-95">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-zinc-300" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
				</svg>
			</button>
		</a>
	</header>

	<section class="mb-10">
		<h2 class="text-lg font-semibold text-zinc-100 mb-4">How are you feeling right now?</h2>
		
		<div class="flex overflow-x-auto gap-3 pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
			{#each moods as mood}
				<button aria-label="Action" 
					onclick={() => selectMood(mood.name)}
					class="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all active:scale-95 
					{$currentMood === mood.name ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700'}"
				>
					<span class="text-lg">{mood.icon}</span>
					<span class="text-sm font-medium { $currentMood === mood.name ? 'text-black font-bold' : 'text-zinc-200' }">{mood.name}</span>
				</button>
			{/each}
		</div>
	</section>

	<section>
		<h2 class="text-lg font-semibold text-zinc-100 mb-4">Curated for your atmosphere</h2>
		
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{#each suggestions as playlist, index}
				<div 
					class="group cursor-pointer flex flex-col gap-2" 
					role="button"
					tabindex="0"
					onclick={() => playTrack(playlist, index)} 
					onkeydown={(e) => e.key === 'Enter' && playTrack(playlist, index)} 
				>
					
					<div class="relative w-full aspect-square rounded-xl overflow-hidden shadow-md">
						<img src={playlist.image} alt={playlist.title} class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
						
						<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
							<button aria-label="Play {playlist.title}" class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:text-black transition-all text-white">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 translate-x-[1px]" viewBox="0 0 24 24" fill="currentColor">
									<path d="M8 5v14l11-7z"/>
								</svg>
							</button>
						</div>
					</div>
					
					<div class="flex flex-col">
						<span class="text-sm font-semibold text-zinc-100 truncate">{playlist.title}</span>
						<span class="text-[11px] text-emerald-500 mt-0.5 truncate">{playlist.context}</span>
					</div>
				</div>
			{/each}
		</div>
	</section>

</div>

<style>
	/* Ensures horizontal scrollbars don't ruin the mobile UI */
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	
	/* Simple fade-in animation for a premium feel on load */
	.animate-fade-in {
		animation: fadeIn 0.5s ease-out forwards;
	}
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
