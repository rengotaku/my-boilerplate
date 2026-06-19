/**
 * Message contracts shared by the popup, content script and background worker,
 * plus thin typed wrappers around the chrome messaging APIs.
 */

/** Popup / content script -> background worker. */
export type Message = { type: 'GET_COUNT' } | { type: 'INCREMENT' }

/** Background worker -> caller. */
export interface CountResponse {
  count: number
}

/** Popup -> content script (in a specific tab). */
export interface PingMessage {
  type: 'PING'
}

/** Content script -> popup: a snapshot of the active page. */
export interface PageInfo {
  title: string
  url: string
}

/** Send a message to the background worker and await its typed reply. */
export const sendToBackground = (msg: Message): Promise<CountResponse> =>
  chrome.runtime.sendMessage(msg)

/** Ask the content script in `tabId` for the current page info. */
export const pingTab = (tabId: number): Promise<PageInfo> =>
  chrome.tabs.sendMessage(tabId, { type: 'PING' } satisfies PingMessage)
