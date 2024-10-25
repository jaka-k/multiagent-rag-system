'use client'

import { FolderInput, ScanFace, SwatchBookIcon } from 'lucide-react'
import { TabsList, TabsTrigger } from '../tabs'

const Sidebar = () => {
  return (
    <div className="px-3 py-4">
      <div className="space-y-1">
        <TabsList className="w-full justify-start px-4 flex-col bg-inherit">
          <TabsTrigger value="File Upload" className="flex items-center">
            <FolderInput className="mr-2 h-6 w-6" />
            File Upload
          </TabsTrigger>
          <TabsTrigger value="Agent Instructions" className="flex items-center">
            <ScanFace className="mr-2 h-6 w-6" />
            Agents
          </TabsTrigger>
          <TabsTrigger
            value="Flashcard Management"
            className="flex items-center"
          >
            <SwatchBookIcon className="mr-2 h-6 w-6" />
            Flashcards
          </TabsTrigger>
        </TabsList>
      </div>
    </div>
  )
}

export default Sidebar
