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
    <div className="flex justify-between space-x-24 mb-4 px-8">
      <div className="flex">
        <Select
          value={selectedLearningArea}
          onValueChange={(value) => setSelectedLearningArea(value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select Area" />
          </SelectTrigger>
          <SelectContent>
            {learningAreas.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="bg-stone-400" variant="default" size="sm">
          <PlusIcon className="mr-2 h-4 w-4" />
          New Learning Area
        </Button>
      </div>
      <Button onClick={() => signOut()}>
        <LogOutIcon className="text-white" size={'16'} />
      </Button>
    </div>
  )
}

export default TopMenu
