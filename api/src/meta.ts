import fs from 'node:fs'
import path from 'node:path'
import { need, OUTPUT } from './env.js'

/**
 * The Meta Model API, spoken to directly over fetch.
 *
 * Standard mode only, never the "-contributor" models: those are cheaper
 * because Meta may train on what we send, and what we send includes
 * children's work.
 */
const BASE = 'https://api.meta.ai/v1'

/** Meta's published pay-as-you-go prices, US dollars. */
export const PRICE = {
  spark: { input: 1.25 / 1e6, cachedInput: 0.15 / 1e6, output: 4.25 / 1e6 },
  image: 0.01,
  samImage: 2.5 / 1000,
  voiceHour: 0.18,
}

export type Effort = 'minimal' | 'low' | 'medium' | 'high'

export type Part =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string | Part[]
}

export interface Usage {
  /** What the call was for, so the log adds up per workbook stage. */
  task: string
  model: string
  inputTokens: number
  cachedTokens: number
  outputTokens: number
  reasoningTokens: number
  images: number
  costUsd: number
}

/** One line per paid call, so the real cost of a workbook can be summed. */
function record(usage: Usage, ref?: string) {
  fs.mkdirSync(OUTPUT, { recursive: true })
  fs.appendFileSync(path.join(OUTPUT, 'usage.jsonl'), JSON.stringify({ at: new Date().toISOString(), ref, ...usage }) + '\n')
}

async function post(endpoint: string, body: unknown) {
  // Meta asks for backoff on 429: start short, double, add jitter.
  let wait = 500
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(BASE + endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${need('META_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.status === 429 && attempt < 5) {
      const after = Number(res.headers.get('retry-after')) * 1000
      await new Promise((r) => setTimeout(r, Math.max(after || 0, wait + Math.random() * 250)))
      wait *= 2
      continue
    }
    const text = await res.text()
    if (!res.ok) throw new Error(`Meta ${endpoint} ${res.status}: ${text.slice(0, 400)}`)
    return JSON.parse(text)
  }
}

export interface ChatOptions {
  task: string
  ref?: string
  effort?: Effort
  maxTokens?: number
  /** A JSON schema; the reply is then guaranteed to match it. */
  schema?: { name: string; schema: object }
}

export async function chat(messages: Message[], o: ChatOptions) {
  const data = await post('/chat/completions', {
    model: 'muse-spark-1.3',
    messages,
    reasoning_effort: o.effort ?? 'low',
    max_tokens: o.maxTokens ?? 16000,
    ...(o.schema ? { response_format: { type: 'json_schema', json_schema: { ...o.schema, strict: false } } } : {}),
  })
  const u = data.usage ?? {}
  const cached = u.prompt_tokens_details?.cached_tokens ?? 0
  const input = u.prompt_tokens ?? 0
  const output = u.completion_tokens ?? 0
  const usage: Usage = {
    task: o.task,
    model: data.model,
    inputTokens: input,
    cachedTokens: cached,
    outputTokens: output,
    reasoningTokens: u.completion_tokens_details?.reasoning_tokens ?? 0,
    images: 0,
    costUsd: (input - cached) * PRICE.spark.input + cached * PRICE.spark.cachedInput + output * PRICE.spark.output,
  }
  record(usage, o.ref)
  const choice = data.choices?.[0]
  const content: string | null = choice?.message?.content ?? null
  if (choice?.finish_reason === 'length' || content == null) {
    throw new Error(`Meta reply was cut short (${o.task}); raise maxTokens or lower effort.`)
  }
  return { content, usage }
}

/** chat() with a schema, parsed. */
export async function chatJson<T>(messages: Message[], o: ChatOptions & { schema: { name: string; schema: object } }) {
  const { content, usage } = await chat(messages, o)
  return { value: JSON.parse(content) as T, usage }
}

/** One illustration, returned as PNG bytes. */
export async function image(prompt: string, o: { task: string; ref?: string; size?: string }) {
  const data = await post('/images/generations', { model: 'muse-image-1.0', prompt, n: 1, ...(o.size ? { size: o.size } : {}) })
  const item = data.data?.[0]
  const usage: Usage = { task: o.task, model: 'muse-image-1.0', inputTokens: 0, cachedTokens: 0, outputTokens: 0, reasoningTokens: 0, images: 1, costUsd: PRICE.image }
  record(usage, o.ref)
  if (item?.b64_json) return Buffer.from(item.b64_json, 'base64')
  if (item?.url) return Buffer.from(await (await fetch(item.url)).arrayBuffer())
  throw new Error('Meta image reply had no image')
}
