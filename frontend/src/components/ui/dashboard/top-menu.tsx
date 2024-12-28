'use client'

import React from 'react'
import { Button } from '../button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@ui/dialog'
import { Input } from '@ui/input'
import { signOut } from '@lib/auth'
import { LogOutIcon } from 'lucide-react'

const TopMenu = () => {
  const [areas, setAreas] = React.useState<string[]>([
    'Golang',
    'Linux',
    'Sys-Design'
  ])
  const [selectedArea, setSelectedArea] = React.useState<string>(areas[0])
  const [newAreaName, setNewAreaName] = React.useState('')

  function handleCreateArea() {
    if (!newAreaName) return
    setAreas((prev) => [...prev, newAreaName])
    setSelectedArea(newAreaName)
    setNewAreaName('')
  }

  return (
    <div className="flex items-center justify-between p-4 border-b">
      {/* 1) Area Selection with shadcn/ui Select */}
      <div className="flex space-x-4">

      <Select value={selectedArea} onValueChange={setSelectedArea}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select area" />
        </SelectTrigger>
        <SelectContent>
          {areas.map((area) => (
            <SelectItem key={area} value={area}>
              {area}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 2) Create New Area Modal */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Create New Area</Button>
        </DialogTrigger>
        {/* Right side: sign out button */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Area</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Name of new area"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button onClick={handleCreateArea}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      <Button
        onClick={() => signOut()}
        className="bg-violet-400 hover:bg-violet-500 text-white"
      >
        <LogOutIcon size={16} />

      </Button>
    </div>
  )
}

export default TopMenu
