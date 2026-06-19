/**
 * Popup controller. Demonstrates the two messaging directions an MV3 extension
 * usually needs:
 *   - popup -> background worker (the click counter), and
 *   - popup -> content script in the active tab (reading the page).
 */

import { pingTab, sendToBackground } from '../lib/messages'

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

btnIncrement.addEventListener('click', async () => {
  const { count } = await sendToBackground({ type: 'INCREMENT' })
  render(count)
})

btnReadPage.addEventListener('click', async () => {
  pageInfoEl.textContent = ''
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) {
    pageInfoEl.textContent = 'No active tab.'
    return
  }
  try {
    const info = await pingTab(tab.id)
    pageInfoEl.textContent = info.title
  } catch {
    // The content script is not present on this page (e.g. chrome:// or the
    // Web Store), which is expected for restricted URLs.
    pageInfoEl.textContent = 'Cannot read this page.'
  }
})

void (async () => {
  const { count } = await sendToBackground({ type: 'GET_COUNT' })
  render(count)
})()
