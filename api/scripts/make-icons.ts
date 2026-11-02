// Saves the icons the shop uses as plain SVG files under web/public/icons,
// so no page ever loads a picture, let alone code, from another site.
// Every file is rebuilt from an allow-list of drawing elements and attributes:
// nothing that can run script or fetch anything survives.
// usage: tsx scripts/make-icons.ts <icons.json from @iconify-json/fluent-emoji-flat>
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GROUP_ICONS, DEFAULT_ICON, Tags } from '../src/catalog/tags.js'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, '../web/public/icons')
const set = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const tags: Record<string, Tags> = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/catalog/tags.json'), 'utf8'))
const wanted = new Set([...Object.values(tags).map((t) => t.icon), ...Object.values(GROUP_ICONS), DEFAULT_ICON])

const ELEMENTS = new Set(['g', 'path', 'circle', 'ellipse', 'rect', 'polygon', 'polyline', 'line', 'defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'use', 'filter', 'feOffset', 'feGaussianBlur', 'feFlood', 'feColorMatrix', 'feBlend', 'feComposite'])
const ATTRS = /^(id|d|fill|fill-rule|fill-opacity|clip-rule|clip-path|mask|filter|stroke|stroke-width|stroke-linecap|stroke-linejoin|stroke-miterlimit|stroke-opacity|opacity|transform|cx|cy|r|rx|ry|x|y|x1|x2|y1|y2|fx|fy|width|height|points|offset|stop-color|stop-opacity|gradientUnits|gradientTransform|spreadMethod|href|xlink:href|filterUnits|color-interpolation-filters|stdDeviation|dx|dy|in|in2|mode|result|type|values|flood-color|flood-opacity|operator|k1|k2|k3|k4|maskUnits)$/

function clean(body: string) {
  return body.replace(/<(\/?)([a-zA-Z:]+)([^>]*?)(\/?)>/g, (_m, close: string, tag: string, attrs: string, self: string) => {
    if (!ELEMENTS.has(tag)) throw new Error(`unexpected <${tag}>`)
    if (close) return `</${tag}>`
    const kept = [...attrs.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)]
      .filter(([, k, v]) => ATTRS.test(k) && !/javascript:|data:|https?:/i.test(v) && (!/href$/.test(k) || v.startsWith('#')))
      .map(([, k, v]) => ` ${k}="${v.replace(/[<>]/g, '')}"`)
      .join('')
    return `<${tag}${kept}${self}>`
  })
}

fs.mkdirSync(OUT, { recursive: true })
for (const name of wanted) {
  const icon = set.icons[name]
  if (!icon) throw new Error(`no icon ${name}`)
  const w = icon.width ?? set.width ?? 32
  const h = icon.height ?? set.height ?? 32
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${clean(icon.body)}</svg>\n`
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svg)
}
fs.writeFileSync(
  path.join(OUT, 'LICENSE.txt'),
  `Icons: Fluent Emoji by Microsoft, https://github.com/microsoft/fluentui-emoji

MIT License

Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
)
console.log('icons', wanted.size)
