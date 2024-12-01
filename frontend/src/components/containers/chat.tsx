'use client'

import { Check, Loader, Plus, Send } from 'lucide-react'
import * as React from 'react'
import Markdown from 'react-markdown'
import useWebSocket from 'react-use-websocket'
import rehypeHighlight from 'rehype-highlight'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn, connectionStatusMapping } from '@/lib/utils'

import { ChatData, Message } from '@types'
import { ScrollArea } from '../ui/scroll-area'

const users = [
  {
    name: 'Olivia Martin',
    email: 'm@example.com'
  },
  {
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com'
  },
  {
    name: 'Emma Wilson',
    email: 'emma@example.com'
  },
  {
    name: 'Jackson Lee',
    email: 'lee@example.com'
  },
  {
    name: 'William Kim',
    email: 'will@email.com'
  }
] as const

type User = (typeof users)[number]

export function CardsChat({ chatData }: { chatData: ChatData }) {
  const socketUrl = `ws://localhost:8080/api/v1/ws/${chatData.id}`
  const [open, setOpen] = React.useState(false)
  const [selectedUsers, setSelectedUsers] = React.useState<User[]>([])
  const [messages, setMessages] = React.useState<Message[]>(
    chatData.messages ?? []
  )
  const [input, setInput] = React.useState('')
  const inputLength = input.trim().length

  const appendToLastAgentMessage = (newContent: string) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1]

      if (lastMessage.role === 'agent') {
        return [
          ...prevMessages.slice(0, prevMessages.length - 1),
          {
            ...lastMessage,
            content: lastMessage.content + newContent
          }
        ]
      }

      // if last message not from agent, return as is (unlikely, but safe)
      return prevMessages
    })
  }
  // TODO: Combine both the appendFuncs
  const appendMetadataMessage = (metadata: string) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1]

      if (lastMessage.role === 'agent') {
        return [
          ...prevMessages.slice(0, prevMessages.length - 1),
          {
            ...lastMessage,
            metadata: JSON.stringify(metadata)
          }
        ]
      }

      return prevMessages
    })
  }

  const { sendMessage, readyState } = useWebSocket(socketUrl, {
    onMessage(event) {
      try {
        const messageData = JSON.parse(event.data)
        if (messageData.content) {
          appendToLastAgentMessage(messageData.content)
        } else if (messageData.metadata) {
          // Handle metadata
          appendMetadataMessage(messageData.metadata)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
  })
  const connectionStatus = connectionStatusMapping(readyState)

  const sendMessageHandler = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inputLength === 0) return
    setMessages([
      ...messages,
      {
        role: 'user',
        content: input
      },
      {
        role: 'agent',
        content: ''
      }
    ])
    sendMessage(input)
    setInput('')
  }

  return (
    <>
      <Card className="flex-auto">
        <CardHeader className="flex flex-row items-center">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarFallback>{chatData.id}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-none">Sofia Davis</p>
              <p className="text-sm text-muted-foreground">m@example.com</p>
            </div>
            <p
              className={cn(
                connectionStatus == 'Open' ? 'bg-green-400' : 'bg-red-500',
                'p-2 rounded-md text-white font-semibold'
              )}
            >
              Connected
            </p>
          </div>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="ml-auto rounded-full"
                  onClick={() => setOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">New message</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={10}>New message</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-screen">
            <div className="space-y-4 h-max w-full flex flex-col">
              {messages.map((message, index) =>
                message.content.length == 0 ? (
                  <Loader className="animate-spin" />
                ) : (
                  <>
                    <Markdown
                      key={message.id}
                      className={cn(
                        'flex w-fit max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm',
                        message.role === 'user'
                          ? 'ml-auto bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {message.content}
                    </Markdown>
                  </>
                )
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="sticky bottom-0">
          <form
            onSubmit={sendMessageHandler}
            className="flex w-full items-center space-x-2"
          >
            <Input
              id="message"
              placeholder="Type your message..."
              className="flex-1"
              autoComplete="off"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <Button type="submit" size="icon" disabled={inputLength === 0}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 p-0 outline-none">
          <DialogHeader className="px-4 pb-4 pt-5">
            <DialogTitle>New Chat</DialogTitle>
            <DialogDescription>
              Invite a user to this thread. This will create a new group
              message.
            </DialogDescription>
          </DialogHeader>
          <Command className="overflow-hidden rounded-t-none border-t">
            <CommandInput placeholder="Search user..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup className="p-2">
                {users.map((user) => (
                  <CommandItem
                    key={user.email}
                    className="flex items-center px-2"
                    onSelect={() => {
                      if (selectedUsers.includes(user)) {
                        return setSelectedUsers(
                          selectedUsers.filter(
                            (selectedUser) => selectedUser !== user
                          )
                        )
                      }

                      return setSelectedUsers(
                        [...users].filter((u) =>
                          [...selectedUsers, user].includes(u)
                        )
                      )
                    }}
                  >
                    <Avatar>
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="ml-2">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    {selectedUsers.includes(user) ? (
                      <Check className="ml-auto flex h-5 w-5 text-primary" />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <DialogFooter className="flex items-center border-t p-4 sm:justify-between">
            {selectedUsers.length > 0 ? (
              <div className="flex -space-x-2 overflow-hidden">
                {selectedUsers.map((user) => (
                  <Avatar
                    key={user.email}
                    className="inline-block border-2 border-background"
                  >
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select users to add to this thread.
              </p>
            )}
            <Button
              disabled={selectedUsers.length < 2}
              onClick={() => {
                setOpen(false)
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
