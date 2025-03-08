import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'

import { cn, estimateTokensAndCost, noSpaceFilename } from '@lib/utils'
import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Input } from '@ui/input'
import { Progress } from '@ui/progress'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@ui/table/table'
import { TabsContent } from '@ui/tabs'
import { FileText, ImageUp, Loader2Icon, UploadIcon } from 'lucide-react'
import React, { FormEvent, useRef, useState } from 'react'

import useEpubProcessor from '@hooks/use-epub-processor'
import { logger } from '@lib/logger.ts'
import {
  CreateDocumentRequest,
  CreateDocumentResponse,
  EpubFile
} from '../../../../types/types'
import { useFirebaseUpload } from '@hooks/use-firebase-upload.tsx'
import EpubElement from '@ui/dashboard/epub-element.tsx'

export function FileUpload() {
  const [file, setFile] = useState<File | undefined>(undefined)
  const [epubFiles, setEpubFiles] = useState<EpubFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    metadata: metadataWorker,
    loading,
    error,
    processEpub
  } = useEpubProcessor()

  const {
    isUploading,
    uploadProgress,
    uploadCoverProgress,
    uploadFile,
    uploadCover
  } = useFirebaseUpload()

  const totalSize = (file ? file.size : 0) / 1024 / 1024

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
      fileInputRef.current?.click()
      return
    }
    if (!metadataWorker?.coverImage) {
      logger.error('Cover image metadata is not available.')
      return
    }

    try {
      // 1) Upload the main EPUB
      const filename = noSpaceFilename(file.name)
      const mainFileMetadata = await uploadFile(file, `epubs/${filename}`)
      const coverFileMetadata = await uploadCover(
        file,
        metadataWorker.coverImage
      )

      // 3) Create your document
      const request: CreateDocumentRequest = {
        title: filename,
        area_id: '24057f5e-f5a9-4c89-abce-d7468fba66aa',
        user_id: '0280748e-cdd3-4501-90b5-1e8af3d1ed5d',
        description: filename,
        file_path: mainFileMetadata.fullPath,
        file_size: mainFileMetadata.size,
        cover_image: coverFileMetadata.fullPath
      }
      const response = await fetchWithAuth<CreateDocumentResponse>(
        '/api/epub-upload',
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

      // 4) Update local state
      const { tokens, cost } = estimateTokensAndCost(file.size)
      const newFile: EpubFile = {
        id: response.data.id,
        name: filename,
        size: mainFileMetadata.size,
        cover: coverFileMetadata.fullPath,
        url: mainFileMetadata.fullPath,
        tokens,
        cost
      }
      setEpubFiles((prev) => [...prev, newFile])

      if (fileInputRef.current) fileInputRef.current.value = ''
      setFile(undefined)
      metadataWorker.coverImage = null
    } catch (error) {
      logger.error('Epub upload failed in handler:', error)
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
              {loading && (
                <span className="text-sm text-gray-400 max-w-36 animate-pulse">
                  Processing EPUB and extracting cover image...
                </span>
              )}
              {error && (
                <p style={{ color: 'red' }}>
                  Error while processing cover image.
                </p>
              )}
              {metadataWorker?.coverImage && (
                <Card
                  className={cn(
                    'h-full rounded-xl w-fit overflow-hidden flex items-center justify-center transition-all duration-500',
                    uploadCoverProgress !== 0 && uploadCoverProgress < 100
                      ? 'opacity-50 grayscale'
                      : '',
                    uploadCoverProgress === 100
                      ? 'animate-[pulse_1s_ease-in-out]'
                      : ''
                  )}
                >
                  <img
                    src={`data:${metadataWorker?.coverImage.mimeType};base64,${metadataWorker?.coverImage.base64}`}
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
                  <EpubElement key={epubfile.id} epubFile={epubfile} />
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
