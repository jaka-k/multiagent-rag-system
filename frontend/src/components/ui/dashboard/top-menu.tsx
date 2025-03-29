'use client'

import useAreaStore from '@context/area-store.tsx'
import { useToast } from '@hooks/use-toast.ts'
import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'
import { logger } from '@lib/logger.ts'
import { signOut } from '@lib/session/auth.ts'
import { CreateAreaResponse } from '@mytypes/types'
import { Button } from '@ui/button'
import AreaSelector from '@ui/dashboard/area-selector.tsx'
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
import { Label } from '@ui/label.tsx'
import { LogOutIcon } from 'lucide-react'
import React, { useEffect } from 'react'

const TopMenu = () => {
  // Hydration fix for server components
  const [isMounted, setIsMounted] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [newAreaName, setNewAreaName] = React.useState('')
  const [newAreaLabel, setNewAreaLabel] = React.useState('')

  const { toast } = useToast()

  const { fetchAreas, setActiveArea, addArea } = useAreaStore.getState()

  useEffect(() => {
    setIsMounted(true)
    fetchAreas()
  }, [fetchAreas])

  if (!isMounted) {
    return null
  }

  async function handleCreateArea() {
    if (!newAreaName) return
    const response = await fetchWithAuth<CreateAreaResponse>('/api/area', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newAreaName,
        label: newAreaLabel
      })
    })

    if (!response.ok) {
      logger.error(
        `Area could not be created: ${JSON.stringify(response.data)}`
      )
      toast({
        title: 'Area not created ⛔️',
        description:
          'We encountered an internal error, when creating your area.'
      })
      return
    }

    addArea({
      ...response.data,
      documents: []
    })
    setActiveArea(response.data.id)
    setNewAreaName('')
    setNewAreaLabel('')
    setOpen(false)
  }

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex space-x-4">
        <AreaSelector />

        <Dialog open={open} onOpenChange={setOpen}>
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
        className="bg-indigo-400 hover:bg-indigo-500 text-white"
      >
        <LogOutIcon size={16} />
      </Button>
    </div>
  )
}

export default TopMenu
