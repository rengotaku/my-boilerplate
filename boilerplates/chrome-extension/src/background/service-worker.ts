/**
 * Background service worker: the extension's single source of truth for the
 * click counter. It persists the value in chrome.storage.local, mirrors it onto
 * the toolbar badge, and answers GET_COUNT / INCREMENT messages from the popup.
 */

import type { CountResponse, Message } from '../lib/messages'
import { formatBadgeText, nextCount } from '../lib/counter'

const STORAGE_KEY = 'count'

const readCount = async (): Promise<number> => {
  const stored = await chrome.storage.local.get(STORAGE_KEY)
  const value = stored[STORAGE_KEY]
  return typeof value === 'number' ? value : 0
}

const writeCount = async (count: number): Promise<void> => {
  await chrome.storage.local.set({ [STORAGE_KEY]: count })
  await chrome.action.setBadgeText({ text: formatBadgeText(count) })
}

const handleMessage = async (msg: Message): Promise<CountResponse> => {
  switch (msg.type) {
    case 'INCREMENT': {
      const count = nextCount(await readCount())
      await writeCount(count)
      return { count }
    }
    case 'GET_COUNT':
      return { count: await readCount() }
  }
}

chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
  handleMessage(msg)
    .then(sendResponse)
    .catch((err: Error) => sendResponse({ error: err.message }))
  return true // keep the channel open for the async response
})

// Keep the badge in sync with stored state when the worker (re)starts.
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: '#0969da' })
  void readCount().then((count) =>
    chrome.action.setBadgeText({ text: formatBadgeText(count) }),
  )
})
