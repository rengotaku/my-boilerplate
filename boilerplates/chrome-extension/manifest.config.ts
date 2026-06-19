import { defineManifest } from '@crxjs/vite-plugin'

// MV3 manifest authored in TypeScript so @crxjs can wire up the TS entry points
// (service worker, popup, content script) and emit a valid manifest.json on build.
export default defineManifest({
  manifest_version: 3,
  name: 'Chrome Extension',
  version: '0.0.0',
  description: 'Chrome Extension (MV3) boilerplate: popup + background + content script.',
  // Keep permissions minimal. `storage` backs the click counter; the content
  // script gets host access for the pages it matches below (no broad
  // host_permissions needed for this demo).
  permissions: ['storage'],
  icons: {
    16: 'public/icons/icon-16.png',
    32: 'public/icons/icon-32.png',
    48: 'public/icons/icon-48.png',
    128: 'public/icons/icon-128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Chrome Extension',
    default_icon: {
      16: 'public/icons/icon-16.png',
      32: 'public/icons/icon-32.png',
      48: 'public/icons/icon-48.png',
      128: 'public/icons/icon-128.png',
    },
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      // Narrow this to the sites your extension targets before shipping.
      matches: ['<all_urls>'],
      js: ['src/content/content.ts'],
      run_at: 'document_idle',
    },
  ],
})
