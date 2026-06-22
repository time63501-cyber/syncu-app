<script lang="ts">
    import { isPlaying, currentSong, playlistQueue, currentTrackIndex } from '$lib/stores';

    let selectedMood = $state("All History"); 
    const moods = ["All History", "Deep Focus", "Late Night Drive", "Workout", "Melancholy"];

    // Mock Database for now (will be replaced by Supabase)
    let historyTracks = [
        { id: 1, title: "Rain on the Window", artist: "LoFi Study", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", mood: "Deep Focus" },
        { id: 2, title: "Midnight Drive", artist: "Synthwave City", image: "https://images.unsplash.com/photo-1614165936126-2c5e0031855e?q=80", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", mood: "Late Night Drive" }
    ];

    let filteredTracks = $derived(
        selectedMood === "All History" 
            ? historyTracks 
            : historyTracks.filter(t => t.mood === selectedMood)
    );

    // This function connects the clicked track to your global player
    function playVaultTrack(track: any, index: number) {
        $playlistQueue = filteredTracks;
        $currentTrackIndex = index;
        $currentSong = {
            title: track.title,
            artist: track.artist,
            coverArt: track.image,
            audioUrl: track.audioUrl
        };
        $isPlaying = true;
    }
</script>

<div class="flex flex-col h-full bg-zinc-950 pt-8 pb-32">
    
    <div class="px-6 mb-6 flex justify-between items-end">
        <div>
            <h1 class="text-3xl font-extrabold text-white">Your Vault</h1>
            <p class="text-sm text-zinc-400 mt-1">Music tailored to your state of mind.</p>
        </div>
        
        <button class="p-2 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 transition shadow-lg active:scale-95" title="Create Custom Mood">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
        </button>
    </div>

    <div class="relative w-full py-2 bg-zinc-950 mb-6">
        <div class="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none"></div>
        <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none"></div>

        <div class="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3 px-6 pb-2">
            {#each moods as mood}
                <button 
                    onclick={() => selectedMood = mood}
                    class="snap-center whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-out
                        {selectedMood === mood 
                            ? 'bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.2)] scale-105' 
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}"
                >
                    {mood}
                </button>
            {/each}
        </div>
    </div>

    <div class="px-6 flex flex-col gap-3 pb-8">
        {#each filteredTracks as track, index}
            <div 
                class="flex items-center gap-4 p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 hover:bg-zinc-800/80 transition cursor-pointer group"
                role="button"
                tabindex="0"
                onclick={() => playVaultTrack(track, index)}
                onkeydown={(e) => e.key === 'Enter' && playVaultTrack(track, index)}
            >
                <img src={track.image} alt={track.title} class="w-14 h-14 rounded-xl object-cover shadow-md" />
                <div class="flex flex-col flex-1 min-w-0">
                    <span class="text-base font-semibold text-white truncate">{track.title}</span>
                    <span class="text-xs text-zinc-400 truncate">{track.artist}</span>
                </div>
                
                <button aria-label="Play" class="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 translate-x-[1px]" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4l12 6-12 6z"/></svg>
                </button>
            </div>
        {/each}
        
        {#if filteredTracks.length === 0}
            <div class="text-center py-16 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800 mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-zinc-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p class="text-zinc-400 text-sm font-medium">No tracks saved to {selectedMood}.</p>
                <p class="text-zinc-600 text-xs mt-1">Listen to more songs to train your vault.</p>
            </div>
        {/if}
    </div>
</div>

<style>
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>