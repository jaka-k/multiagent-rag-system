'use client'

import { Button } from '@components/ui/button'
import { Card, CardContent } from '@components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@components/ui/select'
import { Textarea } from '@components/ui/textarea'
import { containerStyles, textStyles } from '@lib/styles'

export default function FlashcardCreator() {
  return (
    <div className="flex flex-col min-h-full">
      <div className={containerStyles.header}>
        <h2 className={textStyles.h2}>Create Flashcards</h2>
        <Button size="sm">Save</Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Card: Chapter Selection & AI Mode */}
        <Card className={containerStyles.card}>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <label className={textStyles.subtle}>Select Chapter</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chapter-1">
                    Chapter 1: Introduction
                  </SelectItem>
                  <SelectItem value="chapter-2">Chapter 2: Basics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className={textStyles.subtle}>AI Assistant Mode</label>
              <Select defaultValue="auto">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatic Generation</SelectItem>
                  <SelectItem value="manual">Manual Creation</SelectItem>
                  <SelectItem value="hybrid">Hybrid Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Card: Front & Back Fields */}
        <Card className={containerStyles.card}>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <label className={textStyles.subtle}>Instructions</label>
              <Textarea
                placeholder="Enter the front content..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <Button className="w-full">Create Flashcard</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
