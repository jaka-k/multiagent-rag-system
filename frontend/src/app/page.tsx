import ChatTable from '@components/containers/chat-table'
import { Dashboard } from '@components/ui/dashboard/dashboard'
import TopMenu from '@components/ui/dashboard/top-menu'

// Inspiration for frontend: https://ui.shadcn.com/examples/tasks

export default async function Home() {
  return (
    <main className="flex flex-col w-full min-h-screen mt-2 ">
      <TopMenu />
      <div className="flex-shrink-0 w-full ">
        <Dashboard />
      </div>

      <section className="flex-grow w-full px-6 md:px-12">
        <ChatTable />
      </section>
    </main>
  )
}
