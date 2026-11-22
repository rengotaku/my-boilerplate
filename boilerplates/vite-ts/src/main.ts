import { countWords, normalizeWhitespace } from './lib/text'

const form = document.querySelector<HTMLFormElement>('#sample-form')
const input = document.querySelector<HTMLTextAreaElement>('#sample-input')
const output = document.querySelector<HTMLOutputElement>('#sample-output')

if (form && input && output) {
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const normalized = normalizeWhitespace(input.value)
    output.textContent = `${countWords(input.value)} words: ${normalized}`
  })
}
