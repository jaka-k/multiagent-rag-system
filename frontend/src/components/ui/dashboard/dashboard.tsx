import { Tabs } from '@radix-ui/react-tabs'
import { DashboardSection } from './dashboard-section'
import Sidebar from './sidebar'

export function Dashboard() {
  return (
    <div className="flex w-full h-full bg-gray-50">
      <Tabs className="flex flex-1">
        <div className="w-72 shadow-sm border-r">
          <Sidebar />
        </div>
        <div className="flex-1 overflow-auto ">
          <DashboardSection />
        </div>
      </Tabs>
    </div>
  )
}
