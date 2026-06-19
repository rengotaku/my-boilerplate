/**
 * Popup controller. Demonstrates the two messaging directions an MV3 extension
 * usually needs:
 *   - popup -> background worker (the click counter), and
 *   - popup -> content script in the active tab (reading the page).
 */

import type { Message } from '../lib/messages'
import { isError, pingTab, sendToBackground } from '../lib/messages'

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Missing element: ${id}`)
  return el as T
}

const countEl = $('count')
const pageInfoEl = $('page-info')
const btnIncrement = $<HTMLButtonElement>('btn-increment')
const btnReadPage = $<HTMLButtonElement>('btn-read-page')

const render = (count: number): void => {
  countEl.textContent = String(count)
}

// Send a counter message and reflect the result, surfacing any failure (a
// thrown handler or an invalidated extension context) instead of rendering
// "undefined".
const refreshCount = async (msg: Message): Promise<void> => {
  try {
    const res = await sendToBackground(msg)
    if (isError(res)) {
      pageInfoEl.textContent = res.error
      return
    }
    render(res.count)
  } catch (err) {
    pageInfoEl.textContent = (err as Error).message
  }
}

btnIncrement.addEventListener('click', () => void refreshCount({ type: 'INCREMENT' }))

btnReadPage.addEventListener('click', async () => {
  pageInfoEl.textContent = ''
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) {
      pageInfoEl.textContent = 'No active tab.'
      return
    }
    const info = await pingTab(tab.id)
    pageInfoEl.textContent = info.title
  } catch {
    // The content script is not present on this page (e.g. chrome:// or the
    // Web Store), or the popup lost its context — expected on restricted URLs.
    pageInfoEl.textContent = 'Cannot read this page.'
  }
})

void refreshCount({ type: 'GET_COUNT' })
