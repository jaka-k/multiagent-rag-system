'use client'

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  BrainCircuit,
  FileText,
  Italic,
  Link,
  List,
  ListOrdered,
  Loader2,
  Loader2Icon,
  ReceiptText,
  Underline,
  UploadIcon
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Progress } from '@ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@ui/table/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs'
import { Textarea } from '@ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card' // Mock function to simulate file upload

// Mock function to simulate file upload
const uploadFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(URL.createObjectURL(file)), 1000)
  })
}

// Mock function to simulate vector embedding process
const createVectorEmbedding = (fileUrl: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 3000)
  })
}

// Mock function to estimate tokens and cost
const estimateTokensAndCost = (
  fileSize: number
): { tokens: number; cost: number } => {
  const estimatedTokens = Math.floor(fileSize / 4) // Rough estimate: 1 token ≈ 4 bytes
  const costPerThousandTokens = 0.0001 // €0.0001 per 1K tokens (example rate)
  const estimatedCost = (estimatedTokens / 1000) * costPerThousandTokens
  return { tokens: estimatedTokens, cost: estimatedCost }
}

type EpubFile = {
  name: string
  size: number
  url: string
  tokens: number
  cost: number
}

export function DashboardSection() {
  const [epubFiles, setEpubFiles] = useState<EpubFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingFile, setProcessingFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const totalFiles = epubFiles.length
  const totalSize =
    epubFiles.reduce((acc, file) => acc + (file.size || 0), 0) / 1024 / 1024

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const fileUrl = await uploadFile(file)
      clearInterval(progressInterval)
      setUploadProgress(100)

      const { tokens, cost } = estimateTokensAndCost(file.size)
      const newFile: EpubFile = {
        name: file.name,
        size: file.size,
        url: fileUrl,
        tokens,
        cost
      }
      setEpubFiles((prev) => [...prev, newFile])

      // Reset the file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleCreateEmbedding = async (file: EpubFile) => {
    setProcessingFile(file.name)

    try {
      await createVectorEmbedding(file.url)
      // In a real application, you might update the file status or add embedding information here
    } catch (error) {
      console.error('Embedding creation failed:', error)
    } finally {
      setProcessingFile(null)
    }
  }

  return (
    <div className="p-2 h-full w-full flex flex-col space-y-4">
      {/* Top-level TabsContent is rendered in Dashboard, so we just style the internals */}
      <TabsContent
        value="File Upload"
        className="flex-1 bg-gray-50 rounded-lg space-y-6"
      >
        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload EPUB File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <Input
                  type="file"
                  accept=".epub"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  ref={fileInputRef}
                />
                <Button disabled={isUploading} className="w-full">
                  {isUploading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Uploading
                    </>
                  ) : (
                    <>
                      <UploadIcon className="mr-2 h-4 w-4" />
                      Upload EPUB
                    </>
                  )}
                </Button>
                {isUploading && (
                  <Progress value={uploadProgress} className="w-full" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats section */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Files
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalFiles}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Size
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalSize.toFixed(2)} MB
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* File table */}
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            {epubFiles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Estimated Tokens</TableHead>
                    <TableHead>Estimated Cost (EUR)</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {epubFiles.map((file) => (
                    <TableRow key={file.name}>
                      <TableCell className="font-medium">{file.name}</TableCell>
                      <TableCell>
                        {((file.size || 0) / 1024 / 1024).toFixed(2)} MB
                      </TableCell>
                      <TableCell>
                        {(file.tokens || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>€{(file.cost || 0).toFixed(4)}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleCreateEmbedding(file)}
                          disabled={processingFile === file.name}
                          size="sm"
                        >
                          {processingFile === file.name ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing
                            </>
                          ) : (
                            <>
                              <FileText className="mr-2 h-4 w-4" />
                              Create Embedding
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground">
                No files uploaded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent
        value="Agent Instructions"
        className="flex flex-row bg-white rounded-lg shadow-sm p-4"
      >
        <Tabs value="tab1" className="h-full flex flex-col w-1/2 mr-4">
          <div className="border-b mb-2">
            <TabsList className="space-x-2">
              <TabsTrigger
                value="tab1"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-md data-[state=active]:bg-gray-100"
              >
                <BrainCircuit size={14} />
                <span>Rag Context</span>
              </TabsTrigger>
              <TabsTrigger
                value="tab1"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-md data-[state=active]:bg-gray-100"
              >
                <BrainCircuit size={14} />
                <span>Flashcards</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-1 border rounded-md">
            <div className="p-2 border-b flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Underline className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-gray-200 mx-2" />
              <Button variant="ghost" size="icon">
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <AlignRight className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-gray-200 mx-2" />
              <Button variant="ghost" size="icon">
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Link className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-2">
              {/* Some text area or content if needed */}
              <p>Editor area placeholder...</p>
            </div>
          </div>
        </Tabs>

        <div className="flex flex-col w-1/2 ml-4">
          <div className="flex justify-between mb-4">
            <p className="font-medium">
              Enter your instructions for the agent:
            </p>
            <div className="space-x-4">
              <Button
                size="sm"
                className="bg-stone-400 text-white flex items-center space-x-2"
              >
                <ReceiptText size={14} />
                <span>Receipt</span>
              </Button>
            </div>
          </div>
          <Textarea
            className="flex-1 resize-none border border-gray-200 rounded-md p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Type your content here..."
          />
        </div>
      </TabsContent>

      <TabsContent
        value="Flashcard Management"
        className="flex-1 bg-white rounded-lg shadow-sm p-4"
      >
        <div className="h-full">
          <p>Manage your flashcards here. COMING SOON</p>
          <p>Manage your flashcards here. COMING SOON</p>
          <p>Manage your flashcards here. COMING SOON</p>
          <p>Manage your flashcards here. COMING SOON</p>
          <p>Manage your flashcards here. COMING SOON</p>
        </div>
      </TabsContent>
    </div>
  )
}
