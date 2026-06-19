/**
 * Content script: injected into matched pages (see manifest content_scripts).
 * It answers PING messages from the popup with a snapshot of the current page.
 * This is where you would read or modify the DOM of the host page.
 */

import type { PageInfo, PingMessage } from '../lib/messages'

chrome.runtime.onMessage.addListener(
  (msg: PingMessage, _sender, sendResponse: (info: PageInfo) => void) => {
    if (msg.type === 'PING') {
      sendResponse({ title: document.title, url: location.href })
    }
  },
)
