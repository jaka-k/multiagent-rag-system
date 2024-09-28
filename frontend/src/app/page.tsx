import Link from 'next/link'

import ChatTable from '../components/containers/chat-table'

// Something like this: https://ui.shadcn.com/examples/tasks

export default function Home() {
  return (
    <main className="flex flex-col w-full min-h-screen">
      <section className="flex-none h-1/3 bg-gray-200 flex items-center px-6">
        <div className="flex space-x-4">
          <Link className="p-4 bg-slate-50 rounded-lg" href="/chat/1122">
            Chat 1122
          </Link>
          <Link className="p-4 bg-slate-50 rounded-lg" href="/chat/2233">
            Chat 2233
          </Link>
        </div>
      </section>
      <section className="flex-grow w-full px-6 md:px-12 overflow-auto">
        <ChatTable />
      </section>
    </main>
  )
}
