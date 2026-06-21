import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.syncu.app',
  appName: 'SyncU',
  webDir: 'build' // Ensure this is 'build' for SvelteKit
};

export default config;