import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Link className="p-4 bg-slate-50 rounded-lg" href="/chat/1122">
        Chat 1122
      </Link>
      <Link className="p-4 bg-slate-50 rounded-lg" href="/chat/2233">
        Chat 2233
      </Link>
    </main>
  )
}
