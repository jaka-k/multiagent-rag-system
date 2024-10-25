import { Dashboard } from '@components/ui/dashboard/dashboard'
import TopMenu from '@components/ui/dashboard/top-menu'

import ChatTable from '../components/containers/chat-table'

// Something like this: https://ui.shadcn.com/examples/tasks

export default function Home() {
  return (
    <main className="flex flex-col w-full min-h-screen mt-2">
      <TopMenu />

      <Dashboard />

      <section className="flex-grow w-full px-6 md:px-12 overflow-auto">
        <ChatTable />
      </section>
    </main>
  )
}
