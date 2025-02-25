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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@ui/dialog'
import { Input } from '@ui/input'
import { signOut } from '@lib/auth'
import { LogOutIcon } from 'lucide-react'
import { Label } from '@ui/label.tsx'
import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'
import { useToast } from '@hooks/use-toast.ts'
import { logger } from '@lib/logger.ts'

const TopMenu = () => {
  const [areas, setAreas] = React.useState<string[]>([
    'Golang',
    'Linux',
    'Sys-Design'
  ])
  const [selectedArea, setSelectedArea] = React.useState<string>(areas[0])
  const [newAreaName, setNewAreaName] = React.useState('')
  const [newAreaLabel, setNewAreaLabel] = React.useState('')

  const { toast } = useToast()

  async function handleCreateArea() {
    if (!newAreaName) return
    const response = await fetchWithAuth('/api/area', {
      method: 'POST',
      body: JSON.stringify({
        name: newAreaName,
        label: newAreaLabel,
        user_id: '0280748e-cdd3-4501-90b5-1e8af3d1ed5d'
      })
    })

    if (!response.ok) {
      console.log(response)
      toast({
        title: 'Area not created ⛔️',
        description:
          'We encountered an internal error, when creating your area.'
      })
      logger.error('Area could not be created', response.data)
      return
    }
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

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Create New Area</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Area</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Create a learning area to organize your chats, flashcards, and
              uploaded resources.
            </DialogDescription>
            <div className="grid gap-4 py-4">
              <Label htmlFor="name">Name</Label>

              <Input
                placeholder="Name of new area"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
              />
              <Label htmlFor="label">Label</Label>
              <Input
                placeholder="Label of area"
                value={newAreaLabel}
                onChange={(e) => setNewAreaLabel(e.target.value)}
              />

              <p className={'px-1 text-sm text-muted-foreground'}>
                Will be used as Anki deck name and pill tag
              </p>
            </div>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
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
