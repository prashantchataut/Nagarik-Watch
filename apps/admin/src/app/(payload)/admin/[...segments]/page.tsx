/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'
import config from '@payload-config'
import { Root, NotFound } from '@payloadcms/next/views'
import { importMap } from '../importMap'
import { getPayloadHMR } from '@payloadcms/next/utilities'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<Record<string, string | string[]>>
}

export const generateMetadata = async (): Promise<Metadata> => {
  const payloadConfig = (await getPayloadHMR({ config })) as unknown as {
    admin?: { meta?: { title?: string; titleSuffix?: string } }
  }
  return {
    title: payloadConfig.admin?.meta?.title ?? 'Nagarik Watch',
    titleSuffix: payloadConfig.admin?.meta?.titleSuffix ?? ' · Nagarik Watch CMS',
  }
}

const Page = async ({ params, searchParams }: Args) =>
  Root({ config, importMap, params, searchParams })

export default Page
