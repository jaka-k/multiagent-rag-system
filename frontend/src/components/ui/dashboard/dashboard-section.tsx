'use client'

import useAreaStore from '@context/area-store.tsx'
import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { FileUpload } from '@ui/dashboard/file-upload'
import FeatureOverlay from '@ui/feature-overlay.tsx'
import { Input } from '@ui/input'
import { TabsContent } from '@ui/tabs'
import React from 'react'

export function DashboardSection() {
  const [flashcardInstructions, setFlashcardInstructions] = React.useState(
    'Default instructions for flashcard creation...'
  )
  const [ankiDeckName, setAnkiDeckName] = React.useState('')
  const { activeArea } = useAreaStore()

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
      {activeArea ? <FileUpload /> : <NoActiveArea tab="File Upload" />}
      {activeArea ? (
        <TabsContent
          value="Flashcards"
          className="flex-1 bg-gray-50 rounded-lg p-6 space-y-6 overflow-auto"
        >
          <FeatureOverlay>
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
          </FeatureOverlay>
        </TabsContent>
      ) : (
        <NoActiveArea tab="Flashcards" />
      )}
      {activeArea ? (
        <TabsContent
          value="Agent Instructions"
          className="flex-1 bg-gray-50 rounded-lg p-6 space-y-6 overflow-auto"
        >
          <FeatureOverlay>
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
                    <Button onClick={handleSubmitAgentInstructions}>
                      Submit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FeatureOverlay>
        </TabsContent>
      ) : (
        <NoActiveArea tab="Agent Instructions" />
      )}
    </div>
  )
}

const NoActiveArea = ({ tab }: { tab: string }): React.ReactNode => (
  <TabsContent
    value={tab}
    className="flex-1 bg-gray-50 rounded-lg space-y-6 p-6"
  >
    <div className="py-12">
      <p className="text-center">No active area found.</p>
    </div>
  </TabsContent>
)
