import PocketBase from 'pocketbase'

const url = import.meta.env.VITE_POCKETBASE_URL

if (!url) {
  throw new Error('VITE_POCKETBASE_URL is not set. Check your .env file.')
}

export const pb = new PocketBase(url)
