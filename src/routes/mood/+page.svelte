<script lang="ts">
	import { currentMood } from '$lib/stores';

	// State for the conversational UI
	let step = 1;
	let answers = {
		activity: "",
		atmosphere: "",
		preference: ""
	};

	function selectActivity(activity: string) {
		answers.activity = activity;
		step = 2;
	}

	function selectAtmosphere(atmosphere: string) {
		answers.atmosphere = atmosphere;
		step = 3;
	}

	function finishProfiling(preference: string) {
		answers.preference = preference;
		// Update the global store based on their answers
		$currentMood = `${answers.activity} + ${answers.atmosphere}`;
		// In a real app, we would send 'answers' to our Python backend here
		
		// Return to home dashboard
		window.location.href = '/'; 
	}
</script>

<div class="min-h-screen px-6 pt-24 pb-32 flex flex-col items-center justify-center bg-zinc-950 text-zinc-50 relative">
	
	<div class="absolute top-8 right-6">
		<a href="/" class="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition">Skip</a>
	</div>

	{#if step === 1}
		<div class="w-full max-w-md animate-fade-in text-center">
			<h1 class="text-3xl font-bold mb-2">What's the focus right now?</h1>
			<p class="text-zinc-400 mb-10 text-sm">Let's find the right rhythm for your current task.</p>
			
			<div class="flex flex-col gap-3">
				<button on:click={() => selectActivity("Deep Work")} class="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition active:scale-95 text-left flex items-center justify-between group">
					<span class="font-medium">Deep Work & Study</span>
					<span class="text-xl opacity-50 group-hover:opacity-100 transition">🧠</span>
				</button>
				<button on:click={() => selectActivity("Relaxing")} class="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition active:scale-95 text-left flex items-center justify-between group">
					<span class="font-medium">Just Relaxing</span>
					<span class="text-xl opacity-50 group-hover:opacity-100 transition">☕</span>
				</button>
				<button on:click={() => selectActivity("Moving")} class="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition active:scale-95 text-left flex items-center justify-between group">
					<span class="font-medium">Commuting or Walking</span>
					<span class="text-xl opacity-50 group-hover:opacity-100 transition">🚶‍♂️</span>
				</button>
			</div>
		</div>
	{/if}

	{#if step === 2}
		<div class="w-full max-w-md animate-fade-in text-center">
			<h1 class="text-3xl font-bold mb-2">How does it feel around you?</h1>
			<p class="text-zinc-400 mb-10 text-sm">Syncing the soundscape to your environment.</p>
			
			<div class="grid grid-cols-2 gap-3">
				<button on:click={() => selectAtmosphere("Bright")} class="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition active:scale-95 flex flex-col items-center gap-2">
					<span class="text-3xl">☀️</span>
					<span class="font-medium text-sm">Bright & Clear</span>
				</button>
				<button on:click={() => selectAtmosphere("Rainy")} class="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition active:scale-95 flex flex-col items-center gap-2">
					<span class="text-3xl">🌧️</span>
					<span class="font-medium text-sm">Overcast / Raining</span>
				</button>
				<button on:click={() => selectAtmosphere("Night")} class="col-span-2 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition active:scale-95 flex flex-col items-center gap-2">
					<span class="text-3xl">🌙</span>
					<span class="font-medium text-sm">Late Night</span>
				</button>
			</div>
		</div>
	{/if}

	{#if step === 3}
		<div class="w-full max-w-md animate-fade-in text-center">
			<h1 class="text-3xl font-bold mb-2">One last thing.</h1>
			<p class="text-zinc-400 mb-10 text-sm">Do you prefer lyrics right now, or purely instrumental?</p>
			
			<div class="flex flex-col gap-3">
				<button on:click={() => finishProfiling("Vocal")} class="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition active:scale-95 text-center font-medium">
					I want to hear voices
				</button>
				<button on:click={() => finishProfiling("Instrumental")} class="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition active:scale-95 text-center font-medium">
					Keep it instrumental
				</button>
			</div>
		</div>
	{/if}

</div>

<style>
	.animate-fade-in {
		animation: fadeIn 0.4s ease-out forwards;
	}
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(15px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>