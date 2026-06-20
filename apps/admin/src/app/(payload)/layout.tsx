/* THIS FILE IS GENERATED FROM THE PAYLOAD TEMPLATE. */
/* IT CAN BE REGENERATED IF NEEDED. */
import type { Metadata } from 'next'
import config from '@payload-config'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap'
import type { ServerFunctionClient } from 'payload'
import '@payloadcms/next/css'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = (args) =>
  handleServerFunctions({
    config,
    importMap,
    name: args.name,
    args: args.args,
  })

const Layout = ({ children }: Args) =>
  RootLayout({ config, importMap, children, serverFunction })

export const metadata: Metadata = {
  title: 'Nagarik Watch CMS',
  description: 'Editorial CMS for Nagarik Watch (नागरिक वाच)',
}

export default Layout
