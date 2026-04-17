import FoodsPageClient from './FoodsPageClient'

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function FoodsPage(props: PageProps) {
  const searchParams = await props.searchParams
  const categoryId = searchParams?.category as string | undefined

  return <FoodsPageClient categoryId={categoryId} />
}
