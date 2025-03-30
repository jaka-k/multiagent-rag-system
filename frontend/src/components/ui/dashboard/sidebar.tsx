'use client'

import { TabsList, TabsTrigger } from '@ui/tabs'
import { FolderInput, ScanFace, SwatchBookIcon } from 'lucide-react'

const Sidebar = () => {
  return (
    <div className="px-3 py-4 h-full bg-white">
      <div className="space-y-1">
        <TabsList className="w-full flex-col space-y-2 bg-inherit shadow-none p-0">
          <TabsTrigger
            value="File Upload"
            className="
              flex items-center gap-2
              px-4 py-2
              text-sm font-medium
              rounded-md
              data-[state=active]:bg-gray-100
              hover:bg-gray-50
            "
          >
            <FolderInput className="h-5 w-5" />
            <span>File Upload</span>
          </TabsTrigger>

          <TabsTrigger
            value="Agent Instructions"
            className="
              flex items-center gap-2
              px-4 py-2
              text-sm font-medium
              rounded-md
              data-[state=active]:bg-gray-100
              hover:bg-gray-50
            "
          >
            <ScanFace className="h-5 w-5" />
            <span>Agents</span>
          </TabsTrigger>

          <TabsTrigger
            value="Flashcard Management"
            className="
              flex items-center gap-2
              px-4 py-2
              text-sm font-medium
              rounded-md
              data-[state=active]:bg-gray-100
              hover:bg-gray-50
            "
          >
            <SwatchBookIcon className="h-5 w-5" />
            <span>Flashcards</span>
          </TabsTrigger>
        </TabsList>
      </div>
    </div>
  )
}

export default Sidebar
