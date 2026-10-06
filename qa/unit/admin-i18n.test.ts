/**
 * Every piece of admin-panel text has to exist in all three admin languages (de, ar, en): labels,
 * help texts, option labels, array row labels, block names, tab names, sidebar groups. A text that
 * is a plain string, or lacks a language, shows up in the wrong language for someone.
 *
 * Reads the built config (collections after `withAdminLayout`), which needs no database: nothing
 * connects until Payload is initialised.
 */
import { expect, test } from 'vitest'
import type { Field } from 'payload'
import configPromise from '@payload-config'

const LANGS = ['de', 'ar', 'en'] as const
// Numbers, names of platforms and a language's own name read the same in every language.
const SAME_IN_EVERY_LANGUAGE = /^(\d+|facebook|instagram|youtube|linkedin|twitter|tiktok|Deutsch|عربي|English)$/
const problems: string[] = []

function check(where: string, value: unknown, required = true) {
  if (value === undefined || value === null || value === false) {
    if (required) problems.push(`${where}: missing`)
    return
  }
  if (typeof value === 'function') return
  if (typeof value === 'string') {
    problems.push(`${where}: plain string "${value.slice(0, 60)}"`)
    return
  }
  const missing = LANGS.filter((l) => !(value as Record<string, string>)[l])
  if (missing.length > 0) problems.push(`${where}: no ${missing.join(', ')}`)
}

type Loose = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function walk(fields: Field[], where: string) {
  for (const field of fields as Loose[]) {
    const at = `${where}.${field.name ?? `<${field.type}>`}`
    // Hidden fields are never drawn; `blockName` is Payload's own unlabelled input in a block's header.
    if (field.hidden || field.admin?.hidden || field.admin?.disabled || field.type === 'ui' || field.name === 'blockName') continue
    if (field.type === 'tabs') {
      for (const tab of field.tabs as Loose[]) {
        check(`${at}.tab(${tab.name ?? ''}).label`, tab.label)
        check(`${at}.tab.description`, tab.description ?? tab.admin?.description, false)
        walk(tab.fields, at)
      }
      continue
    }
    if (field.name || field.type === 'collapsible') check(`${at}.label`, field.label, field.label !== false)
    check(`${at}.description`, field.admin?.description, false)
    check(`${at}.placeholder`, field.admin?.placeholder, false)
    if (field.labels) {
      check(`${at}.labels.singular`, field.labels.singular)
      check(`${at}.labels.plural`, field.labels.plural)
    }
    for (const option of (field.options ?? []) as Loose[]) {
      if (typeof option === 'string') {
        if (!SAME_IN_EVERY_LANGUAGE.test(option)) problems.push(`${at}.option: plain string "${option}"`)
      }
      else if (typeof option.label !== 'string' || !SAME_IN_EVERY_LANGUAGE.test(option.label)) check(`${at}.option(${option.value})`, option.label)
    }
    for (const block of (field.blocks ?? []) as Loose[]) {
      check(`${at}.block(${block.slug}).labels.singular`, block.labels?.singular)
      check(`${at}.block(${block.slug}).labels.plural`, block.labels?.plural)
      walk(block.fields, `${at}.block(${block.slug})`)
    }
    if (field.fields) walk(field.fields, at)
  }
}

const config = await configPromise
// Payload's own collections (preferences, migrations, locked documents) never appear in the panel.
const collections = config.collections.filter((c) => !c.slug.startsWith('payload-'))

for (const collection of collections) {
  const c = collection as Loose
  if (c.admin?.hidden === true) continue
  check(`${c.slug}.labels.singular`, c.labels?.singular)
  check(`${c.slug}.labels.plural`, c.labels?.plural)
  check(`${c.slug}.group`, c.admin?.group)
  check(`${c.slug}.description`, c.admin?.description, false)
  walk(collection.fields, c.slug)
}

for (const global of config.globals) {
  const g = global as Loose
  if (g.admin?.hidden === true) continue
  check(`${g.slug}.label`, g.label)
  check(`${g.slug}.group`, g.admin?.group, false)
  check(`${g.slug}.description`, g.admin?.description, false)
  walk(global.fields, g.slug)
}

test('admin labels, help texts and options exist in de, ar and en', () => {
  expect(problems).toEqual([])
})
