import useAreaStore from '@context/area-store.tsx'
import useEpubProcessor from '@hooks/use-epub-processor'
import { useFirebaseUpload } from '@hooks/use-firebase-upload.tsx'
import { logger } from '@lib/logger.ts'
import {
  cn,
  createPersistentDownloadUrl,
  estimateTokensAndCost,
  noSpaceFilename
} from '@lib/utils'
import { CreateDocumentRequest, EpubFile } from '@mytypes/types'
import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import EpubElement from '@ui/dashboard/epub-element.tsx'
import { Input } from '@ui/input'
import { Progress } from '@ui/progress'
import { Skeleton } from '@ui/skeleton.tsx'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@ui/table/table'
import { TabsContent } from '@ui/tabs'
import {
  FileText,
  ImageDown,
  ImageUp,
  Loader2Icon,
  UploadIcon
} from 'lucide-react'
import React, { FormEvent, useRef, useState } from 'react'
import { createDocument } from '@lib/services/epub-api.ts'

export function FileUpload() {
  const [file, setFile] = useState<File | undefined>(undefined)
  const [epubFiles, setEpubFiles] = useState<EpubFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { activeArea } = useAreaStore()

  const {
    metadata: metadataFromWorker,
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

  if (!activeArea) return <Skeleton />

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formFile = e.target.files?.[0]

    if (formFile && formFile.name.endsWith('.epub')) {
      setFile(formFile)
      await processEpub(formFile)
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

    if (!metadataFromWorker?.coverImage) {
      logger.error('Cover image metadata is not available.')
      return
    }

    try {
      const filename = noSpaceFilename(file.name)
      const mainFileMetadata = await uploadFile(file, `epubs/${filename}`)
      const coverFileMetadata = await uploadCover(
        file,
        metadataFromWorker.coverImage
      )

      const request: CreateDocumentRequest = {
        title: metadataFromWorker.metadata.title ?? mainFileMetadata.name,
        area_id: activeArea.id,
        description:
          metadataFromWorker.metadata.title ||
          mainFileMetadata.customMetadata?.description ||
          '',
        file_path: mainFileMetadata.fullPath,
        file_size: mainFileMetadata.size,
        cover_image: createPersistentDownloadUrl(coverFileMetadata)
      }

      const response = await createDocument(request)

      const { tokens, cost } = estimateTokensAndCost(file.size)
      const newFile: EpubFile = {
        id: response.id,
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
      metadataFromWorker.coverImage = undefined
    } catch (err) {
      logger.error('Epub upload failed in handler:', err)
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
                <Button
                  type="submit"
                  disabled={isUploading || loading}
                  className="w-full"
                >
                  {isUploading || loading ? (
                    <>
                      {loading ? (
                        <ImageDown className="mr-2 h-4 w-4 animate-pulse" />
                      ) : (
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      )}
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
                <p
                  style={{
                    color: 'red'
                  }}
                >
                  Error while processing cover image.
                </p>
              )}
              {metadataFromWorker?.coverImage && (
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
                    src={`data:${metadataFromWorker?.coverImage.mimeType};base64,${metadataFromWorker?.coverImage.base64}`}
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
