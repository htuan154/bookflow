/**
 * @typedef {Object} ChatbotResponse
 * @property {string} province
 * @property {{ name: string, hint?: string }[]} places
 * @property {{ name: string, where?: string }[]} dishes
 * @property {string[]} tips
 * @property {'nosql'|'nosql+llm'|'fallback'} source
 */
