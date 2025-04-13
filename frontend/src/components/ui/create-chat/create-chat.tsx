'use client'

import { Button } from '@ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@ui/dialog'
import { Input } from '@ui/input'
import { Label } from '@ui/label'
import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@ui/select.tsx'
import useAreaStore from '@context/area-store.tsx'
import { createChat } from '@lib/fetchers/fetch-chat.ts'
import { useToast } from '@hooks/use-toast.ts'
import { logger } from '@lib/logger.ts'
import { useRouter } from 'next/navigation'

export default function CreateChat({
  open,
  setOpen
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const [title, setTitle] = React.useState<string>('')
  const router = useRouter()
  const { areas, activeArea, setActiveArea } = useAreaStore()
  const { toast } = useToast()

  if (open && !activeArea) {
    toast({
      title: 'No active area selected! 🫣',
      description: 'This is an invalid app state and should not happen!'
    })
    setOpen(false)
    return null
  }

  const handleCreateChat = async () => {
    try {
      if (!activeArea?.id) {
        throw new Error('No active area selected')
      }

      const response = await createChat(title, activeArea.id)
      router.push(`/chat/${response.id}`)
    } catch (error) {
      toast({
        title: 'Chat was not created!',
        description: 'Something went wrong while creating your chat. 👀'
      })
      logger.error('Chat could not be created', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label>Select Area</Label>
            <Select value={activeArea?.id} onValueChange={setActiveArea}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an area..." />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => handleCreateChat()}
            disabled={!title || !activeArea?.id}
          >
            Create Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
