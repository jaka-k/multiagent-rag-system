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
import { Button } from '../button'
import { Input } from '../input'
import { Progress } from '../progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../table/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs'
import { Textarea } from '../textarea'

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
    <div className="p-4 flex h-full">
      <TabsContent value="File Upload" className="flex-1 p-4">
        <div className="flex items-center space-x-2 hover:bg-stone-100">
          <Input
            type="file"
            accept=".epub"
            onChange={handleFileUpload}
            disabled={isUploading}
            ref={fileInputRef}
          />
          <Button disabled={isUploading}>
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
        </div>
        {isUploading && <Progress value={uploadProgress} className="w-full" />}

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
                <TableCell>{file.name}</TableCell>
                <TableCell>{(file.size / 1024 / 1024).toFixed(2)} MB</TableCell>
                <TableCell>{file.tokens.toLocaleString()}</TableCell>
                <TableCell>€{file.cost.toFixed(4)}</TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleCreateEmbedding(file)}
                    disabled={processingFile === file.name}
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
      </TabsContent>
      <TabsContent value="Agent Instructions" className="flex flex-row">
        <Tabs value="tab1" className="h-full flex flex-col">
          <div className="border-b">
            <TabsList>
              <TabsTrigger value="tab1" className="bg-stone-400 space-x-2">
                <BrainCircuit size={14} />
                <p>Rag Context</p>
              </TabsTrigger>
              <TabsTrigger value="tab1" className="bg-stone-400 space-x-2">
                <BrainCircuit size={14} />
                <p>Flashcards</p>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 flex flex-col">
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
              <div className="w-px h-6 bg-border mx-2" />
              <Button variant="ghost" size="icon">
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <AlignRight className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-2" />
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
          </div>
        </Tabs>

        <div className="flex flex-col h-full">
          <div className="flex justify-between mb-4">
            <p>Enter your instructions for the agent:</p>
            <div className="space-x-4">
              <Button size={'sm'} className="bg-stone-400 space-x-2">
                <ReceiptText size={14} />
              </Button>
            </div>
          </div>
          <Textarea
            className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Type your content here..."
          />
        </div>
      </TabsContent>
      <TabsContent value="Flashcard Management">
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
