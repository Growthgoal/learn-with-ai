import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/** The repo root, where .env lives beside the README. */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
config({ path: path.join(ROOT, '.env') })

export function need(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is missing. Copy .env.example to .env and fill it in.`)
  return value
}

/** Where generated workbooks and the usage log go. Never committed. */
export const OUTPUT = path.join(ROOT, 'output')
