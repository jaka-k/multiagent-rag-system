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

const chromaNameRegex = /^(?!.*\.\.)[a-z0-9](?:[a-z0-9._-]{1,61})?[a-z0-9]$/
const ipRegex = /^\d{1,3}(\.\d{1,3}){3}$/

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
    if (
      newAreaLabel.length < 3 ||
      newAreaLabel.length > 63 ||
      !chromaNameRegex.test(newAreaLabel) ||
      ipRegex.test(newAreaLabel)
    ) {
      toast({
        title: 'Invalid name ⛔️',
        description:
          'Please follow the naming conditions for ChromaDB collections.'
      })
      return
    }

    const response = await fetchWithAuth<CreateAreaResponse>('/api/area', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
                required={true}
                onChange={(e) => setNewAreaName(e.target.value)}
              />
              <Label htmlFor="label">Label</Label>
              <Input
                placeholder="Label of area"
                value={newAreaLabel}
                minLength={4}
                onChange={(e) => setNewAreaLabel(e.target.value)}
              />

              <p className="px-2 pt-2 text-xs text-muted-foreground">
                Needs to be <u>at least 4 characters</u>. Will be used as
                ChromaDB collection, Anki deck name, and pill tag. Other
                restrictions:
              </p>

              <div className="px-4 pb-2 pt-1">
                <p className="text-[11px] text-muted-foreground mb-1">
                  Chroma uses collection names in the URL, so there are a few
                  restrictions:
                </p>
                <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-1">
                  <li>Between 3 and 63 characters long.</li>
                  <li>
                    Must start and end with a lowercase letter or digit. Can
                    include dots, dashes, and underscores in between.
                  </li>
                  <li>No two consecutive dots.</li>
                  <li>Must not be a valid IP address.</li>
                </ul>
              </div>
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
