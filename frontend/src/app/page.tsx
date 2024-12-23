import { Dashboard } from '@components/ui/dashboard/dashboard'
import TopMenu from '@components/ui/dashboard/top-menu'

import ChatTable from '../components/containers/chat-table'

// Something like this: https://ui.shadcn.com/examples/tasks

export default function Home() {
  return (
    <main className="flex flex-col w-full min-h-screen mt-2">
      <TopMenu />
      <div className="flex-shrink-0 w-full h-[33vh] lg:h-[25vh] 2xl:h-[20vh]">
        <Dashboard />
      </div>

      <section className="flex-grow w-full px-6 md:px-12 overflow-auto">
        <ChatTable />
      </section>
    </main>
  )
}
