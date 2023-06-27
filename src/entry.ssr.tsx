/* eslint-disable no-console */
/**
 * WHAT IS THIS FILE?
 *
 * SSR entry point, in all cases the application is rendered outside the browser, this
 * entry point will be the common one.
 *
 * - Server (express, cloudflare...)
 * - npm run start
 * - npm run preview
 * - npm run build
 *
 */
import { renderToStream, type RenderToStreamOptions } from '@builder.io/qwik/server'
// eslint-disable-next-line import/no-unresolved
import { manifest } from '@qwik-client-manifest'
import { isDev } from '@builder.io/qwik/build'

import Root from './root'

export default function (opts: RenderToStreamOptions) {
  return renderToStream(<Root />, {
    manifest,
    ...opts,
    // Use container attributes to set attributes on the html tag.
    containerAttributes: {
      lang: 'en-us',
      ...opts.containerAttributes,
    },
  })
}

// Temporary workaround while the duplicate JSXNode warning is not fixed.
// This warning bug happens with some packages such as @qwikest/icons.
// Open issue at https://github.com/BuilderIO/qwik/issues/3883
if (isDev) {
  const consoleWarn = console.warn
  const SUPPRESSED_WARNINGS = ['Duplicate implementations of "JSXNode" found']

  console.warn = function filterWarnings(msg, ...args) {
    if (
      !SUPPRESSED_WARNINGS.some(
        (entry) => msg.includes(entry) || args.some((arg) => arg.includes(entry))
      )
    )
      consoleWarn(msg, ...args)
  }
}
