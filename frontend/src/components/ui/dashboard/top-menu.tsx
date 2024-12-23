'use client'

import { signOut } from '@lib/auth'
import { LogOutIcon, PlusIcon } from 'lucide-react'
import React from 'react'
import { Button } from '../button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../select'

const TopMenu = () => {
  const [learningAreas, setLearningAreas] = React.useState<string[]>([
    'Golang',
    'Linux',
    'Sys-Design'
  ])
  const [selectedLearningArea, setSelectedLearningArea] =
    React.useState<string>('Golang')

  return (
      <div className="flex items-center justify-between space-x-6 bg-white px-8 py-4 shadow-sm mb-4">
        {/* Left side: select + button */}
        <div className="flex items-center space-x-4">
          <Select
              value={selectedLearningArea}
              onValueChange={(value) => setSelectedLearningArea(value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select Area"/>
            </SelectTrigger>
            <SelectContent>
              {learningAreas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="bg-stone-400 hover:bg-stone-500 text-white" size="sm">
            <PlusIcon className="mr-2 h-4 w-4"/>
            New Learning Area
          </Button>
        </div>

        {/* Right side: sign out button */}
        <Button
            onClick={() => signOut()}
            className="bg-pink-500 hover:bg-pink-600 text-white"
        >
          <LogOutIcon className="mr-2" size={16}/>
          Sign Out
        </Button>
      </div>
  )
}

export default TopMenu
