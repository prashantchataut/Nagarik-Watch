/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'
import config from '@payload-config'
import { RootLayout } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap'
import '@payloadcms/next/css'

type Args = {
  children: React.ReactNode
}

const Layout = ({ children }: Args) =>
  RootLayout({ config, importMap, children })

export const metadata: Metadata = {
  title: 'Nagarik Watch CMS',
  description: 'Editorial CMS for Nagarik Watch (नागरिक वाच)',
}

export default Layout
