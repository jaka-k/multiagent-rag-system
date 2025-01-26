'use client'

import { Tabs, TabsList, TabsTrigger } from '@ui/tabs'
import React from 'react'
import { DashboardSection } from '@ui/dashboard/dashboard-section'

export function Dashboard() {
  return (
    <div className="flex w-full h-full bg-gray-50">
      <Tabs defaultValue="File Upload" className="flex-1 flex flex-col">
        <TabsList className="p-4 flex-shrink-0">
          <TabsTrigger value="File Upload">File Upload</TabsTrigger>
          <TabsTrigger value="Flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="Agent Instructions">
            Agent Instructions
          </TabsTrigger>
        </TabsList>
        <DashboardSection />
      </Tabs>
    </div>
  )
}
