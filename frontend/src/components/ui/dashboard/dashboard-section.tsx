'use client'

import React from 'react'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { TabsContent } from '@ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { FileUpload } from '@ui/dashboard/file-upload'

export function DashboardSection() {
  const [flashcardInstructions, setFlashcardInstructions] = React.useState(
    'Default instructions for flashcard creation...'
  )
  const [ankiDeckName, setAnkiDeckName] = React.useState('')

  function handleSubmitFlashcards() {
    alert(
      `Flashcard Instructions: ${flashcardInstructions}\nAnki Deck: ${ankiDeckName}`
    )
  }

  const [agentInstructions, setAgentInstructions] = React.useState(
    'Default instructions for web_research agent...'
  )
  const [additionalWebsites, setAdditionalWebsites] = React.useState('')

  function handleSubmitAgentInstructions() {
    alert(
      `Agent Instructions: ${agentInstructions}\nWebsites: ${additionalWebsites}`
    )
  }

  return (
    <div className="p-2 h-full w-full flex flex-col space-y-4">
      <FileUpload />
      <TabsContent
        value="Flashcards"
        className="flex-1 bg-gray-50 rounded-lg p-6 space-y-6 overflow-auto"
      >
        <Card>
          <CardHeader>
            <CardTitle>Flashcard Creation Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Current Instructions
                </label>
                <textarea
                  className="w-full h-32 border rounded-md p-2"
                  value={flashcardInstructions}
                  onChange={(e) => setFlashcardInstructions(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Anki Deck Name
                </label>
                <Input
                  placeholder="Enter Anki deck name"
                  value={ankiDeckName}
                  onChange={(e) => setAnkiDeckName(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSubmitFlashcards}>Submit</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent
        value="Agent Instructions"
        className="flex-1 bg-gray-50 rounded-lg p-6 space-y-6 overflow-auto"
      >
        <Card>
          <CardHeader>
            <CardTitle>Web Research Agent Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Instructions
                </label>
                <textarea
                  className="w-full h-32 border rounded-md p-2"
                  value={agentInstructions}
                  onChange={(e) => setAgentInstructions(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Additional Blogs/Websites
                </label>
                <Input
                  placeholder="Comma-separated list of websites"
                  value={additionalWebsites}
                  onChange={(e) => setAdditionalWebsites(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSubmitAgentInstructions}>Submit</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  )
}
