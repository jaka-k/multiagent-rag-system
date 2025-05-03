import useDocumentStore from '@context/document-store.tsx'
import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth'
import { logger } from '@lib/logger'
import { estimateTokensAndCost } from '@lib/utils.ts'
import { Document, EmbeddingStatus } from '@mytypes/types'
import { Button } from '@ui/button'
import { TableCell, TableRow } from '@ui/table/table'
import { Check, DrumIcon, Loader2Icon, TriangleAlert } from 'lucide-react'
import React, { useState } from 'react'

function EpubElement({ doc }: { doc: Document }) {
  console.log(doc)
  const { updateDocument } = useDocumentStore()
  const [currentStep, setCurrentStep] = useState<string>(doc?.embeddingStatus)
  const { tokens, cost } = estimateTokensAndCost(doc.fileSize)

  const createVectorEmbedding = async () => {
    try {
      setCurrentStep('processing')

      const response = await fetchWithAuth(`/api/embedding/${doc.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to create vector embed')
      }

      const interval = setInterval(async () => {
        try {
          const statusResponse = await fetchWithAuth<{ status: string }>(
            `/api/embedding-status/${doc.id}`
          )
          const { data } = statusResponse

          if (!statusResponse.ok) {
            setCurrentStep('failed')
            throw new Error(
              'Embedding failed with status 400: ' +
                `/api/embedding-status/${doc.id}`
            )
          }

          const status = statusResponse?.data
            .status as unknown as EmbeddingStatus

          updateDocument(doc.areaId, doc.id, {
            embeddingStatus: status
          })
          setCurrentStep(status)

          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval)
          }
        } catch (error) {
          logger.error('Failed to fetch embedding status:', error)
          clearInterval(interval)
        }
      }, 500)
    } catch (error) {
      logger.error('Embedding creation failed:', error)
    }
  }

  return (
    <TableRow key={doc.id}>
      <TableCell className="font-medium">{doc.title}</TableCell>
      <TableCell>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</TableCell>
      <TableCell>{(tokens || 0).toLocaleString()}</TableCell>
      <TableCell>€{(cost || 0).toFixed(4)}</TableCell>
      <TableCell className="text-right">
        {currentStep === 'processing' ? (
          <div
            className={
              'bg-purple-500 text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium'
            }
          >
            <Loader2Icon className="mr-4 h-4 w-4 animate-spin" />
            Processing...
          </div>
        ) : currentStep === 'embedding' ? (
          <div
            className={
              'bg-indigo-500 text-primary-foreground h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium'
            }
          >
            <DrumIcon className="mr-2 h-4 w-4 animate-pulse" />
            Embedding...
          </div>
        ) : currentStep === 'completed' ? (
          <div
            className={
              'bg-green-500 text-primary-foreground h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium'
            }
          >
            <Check className="mr-2 h-4 w-4" />
            Done
          </div>
        ) : currentStep === 'failed' ? (
          <div
            className={
              'bg-red-600 text-primary-foreground h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium'
            }
          >
            <TriangleAlert className="mr-2 h-4 w-4" />
            Failed
          </div>
        ) : (
          <Button
            onClick={() => createVectorEmbedding()}
            className={'w-full bg-black'}
          >
            Create Embedding
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

export default EpubElement
