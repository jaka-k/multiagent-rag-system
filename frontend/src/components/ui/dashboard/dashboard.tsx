import { Tabs } from '@radix-ui/react-tabs'
import { DashboardSection } from './dashboard-section'
import Sidebar from './sidebar'

export function Dashboard() {
  return (
    <div className="flex">
      <Tabs className="flex-1 flex ">
        <div className="w-60 border-r">
          <Sidebar />
        </div>
        <div className="flex-1 overflow-auto ">
          <DashboardSection />
        </div>
      </Tabs>
    </div>
  )
}
