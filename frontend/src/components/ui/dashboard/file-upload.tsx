import { fetchWithAuth } from '@lib/fetchers/fetchWithAuth'
import { storage } from '@lib/storage/storage'
import { estimateTokensAndCost } from '@lib/utils'
import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
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
import { TabsContent } from '@ui/tabs'
import { ref, uploadBytesResumable, UploadTaskSnapshot } from 'firebase/storage'
import {
  FileText,
  ImageUp,
  Loader2,
  Loader2Icon,
  UploadIcon
} from 'lucide-react'
import React, { FormEvent, useRef, useState } from 'react'

import useEpubProcessor from '@hooks/use-epub-processor'

type EpubFile = {
  id: string
  name: string
  size: number
  url: string
  cover: string
  tokens: number
  cost: number
}

type CreateDocumentRequest = {
  title: string
  area_id: string
  user_id: string
  description: string
  file_path: string
  file_size: number
}

type CreateDocumentResponse = {
  message: string
  id: string
}

export function FileUpload() {
  const [file, setFile] = useState<File | undefined>(undefined)
  const [epubFiles, setEpubFiles] = useState<EpubFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingFile, setProcessingFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { metadata, loading, error, processEpub } = useEpubProcessor()

  const totalSize =
    (file ? file.size : 0) /
    1024 /
    1024

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith('.epub')) {
      setFile(file)
      await processEpub(file)
    } else {
      alert('Please upload a valid .epub file')
    }
  }

  const handleFileUpload:
    | React.FormEventHandler<HTMLFormElement>
    | undefined = async (event: FormEvent) => {
    event.preventDefault()
    if (!file) {
      fileInputRef?.current?.click()
    }
    console.log(file)
    if (!file) return

    const storageRef = ref(storage, `epubs/${file.name}`)

    console.log(storage)
    console.log(storageRef)

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(progress)
        },
        (error: Error) => {
          console.log(error)
        }
      )

      const metadataFirebase = (await uploadTask).metadata
      const request: CreateDocumentRequest = {
        title: file.name,
        area_id: '24057f5e-f5a9-4c89-abce-d7468fba66aa',
        user_id: '0280748e-cdd3-4501-90b5-1e8af3d1ed5d',
        description: file.name,
        file_path: metadataFirebase.fullPath,
        file_size: metadataFirebase.size
      }
      const response = await fetchWithAuth<CreateDocumentResponse>(
        '/api/epub',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        }
      )

      if (!response.ok) {
        throw Error(
          `Could not create document reference: ${response.data.message}`
        )
      }

      const { tokens, cost } = estimateTokensAndCost(file.size)
      const newFile: EpubFile = {
        id: response.data.id,
        name: file.name,
        size: metadataFirebase.size,
        cover: metadataFirebase.fullPath,
        url: metadataFirebase.fullPath,
        tokens,
        cost
      }
      // TODO: Properly call FASTAPI

      setEpubFiles((prev) => [...prev, newFile])

      if (fileInputRef.current) fileInputRef.current.value = ''
      setFile(undefined)
      metadata.coverImage = null
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const createVectorEmbedding = (_fileUrl: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 3000)
    })
  }

  const handleCreateEmbedding = async (epubfile: EpubFile) => {
    setProcessingFile(epubfile.name)

    try {
      // Todo: create embedding endpoint
      await createVectorEmbedding(epubfile.url)
    } catch (error) {
      console.error('Embedding creation failed:', error)
    } finally {
      setProcessingFile(null)
    }
  }

  return (
    <TabsContent
      value="File Upload"
      className="flex-1 bg-gray-50 rounded-lg space-y-6 p-6"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* 1) Card: EPUB Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload EPUB File</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFileUpload}>
              <div className="flex flex-col space-y-4">
                <Input
                  type="file"
                  accept=".epub"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  ref={fileInputRef}
                />
                <Button type="submit" disabled={isUploading} className="w-full">
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
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr] xl:grid-cols-[2fr_3fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 ">
              <CardTitle className="text-sm font-medium">Cover</CardTitle>
              <ImageUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="h-[185px] md:h-[150px] lg:h-[200px] flex items-center justify-center">
              {loading && <span className="text-sm text-gray-400 max-w-36 animate-pulse">Processing EPUB and extracting cover image...</span>}
              {error && <p style={{ color: 'red' }}>Error while processing cover image.</p>}
              {metadata?.coverImage && (
                <Card className="h-full rounded-xl w-fit overflow-hidden flex items-center justify-center">
                  <img
                    src={`data:${metadata?.coverImage.mimeType};base64,${metadata?.coverImage.base64}`}
                    className="object-contain h-full w-auto"
                    alt="Cover"
                  />
                </Card>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">File Size</CardTitle>
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

      <Card className="flex-1 min-h-max overflow-hidden">
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent className="h-full overflow-auto">
          {epubFiles.length > 0 ? (
            <Table className="overflow-auto">
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Estimated Tokens</TableHead>
                  <TableHead>Estimated Cost (EUR)</TableHead>
                  <TableHead>Status/Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {epubFiles.map((epubfile) => (
                  <TableRow key={epubfile.name}>
                    <TableCell className="font-medium">
                      {epubfile.name}
                    </TableCell>
                    <TableCell>
                      {(epubfile.size / 1024 / 1024).toFixed(2)} MB
                    </TableCell>
                    <TableCell>
                      {(epubfile.tokens || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>€{(epubfile.cost || 0).toFixed(4)}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleCreateEmbedding(epubfile)}
                        disabled={processingFile === epubfile.name}
                        size="sm"
                      >
                        {processingFile === epubfile.name ? (
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
            <CardContent className="h-full overflow-auto">
              <div className="text-center text-muted-foreground">
                No files uploaded yet.
              </div>
            </CardContent>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}
