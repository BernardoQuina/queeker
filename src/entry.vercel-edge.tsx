/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for Vercel Edge when building for production.
 *
 * Learn more about the Vercel Edge integration here:
 * - https://qwik.builder.io/docs/deployments/vercel-edge/
 *
 */
import {
  createQwikCity,
  type PlatformVercel,
} from '@builder.io/qwik-city/middleware/vercel-edge'
// eslint-disable-next-line import/no-unresolved
import qwikCityPlan from '@qwik-city-plan'
// eslint-disable-next-line import/no-unresolved
import { manifest } from '@qwik-client-manifest'
import render from './entry.ssr'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface QwikCityPlatform extends PlatformVercel {}
}

export default createQwikCity({ render, qwikCityPlan, manifest })
