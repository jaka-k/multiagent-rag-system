import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth'
import { logger } from '@lib/logger'
import { Button } from '@ui/button'
import { TableCell, TableRow } from '@ui/table/table'
import { Check, DrumIcon, Loader2Icon } from 'lucide-react'
import React, { useState } from 'react'

import { EpubFile } from '../../../../types/types'

function EpubElement({ epubFile }: { epubFile: EpubFile }) {
  const [currentStep, setCurrentStep] = useState<string>()

  const createVectorEmbedding = async () => {
    try {
      setCurrentStep('processing')

      const response = await fetchWithAuth(`/api/embedding/${epubFile.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to create vector embed')
      }

      const interval = setInterval(async () => {
        try {
          const statusResponse = await fetchWithAuth<{ status: string }>(
            `/api/embedding-status/${epubFile.id}`
          )
          const { data } = statusResponse
          if (!statusResponse.ok) {
            throw new Error(
              'Embedding failed with status 400: ' +
                `/api/embedding-status/${epubFile.id}`
            )
          }

          setCurrentStep(statusResponse?.data.status)

          if (data.status === 'completed') {
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
    <TableRow key={epubFile.name}>
      <TableCell className="font-medium">{epubFile.name}</TableCell>
      <TableCell>{(epubFile.size / 1024 / 1024).toFixed(2)} MB</TableCell>
      <TableCell>{(epubFile.tokens || 0).toLocaleString()}</TableCell>
      <TableCell>€{(epubFile.cost || 0).toFixed(4)}</TableCell>
      <TableCell>
        <Button
          onClick={() => createVectorEmbedding()}
          className={`w-full ${
            currentStep === 'completed' ? 'bg-green-500' : 'bg-black'
          }`}
        >
          {currentStep === 'processing' ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : currentStep === 'embedding' ? (
            <>
              <DrumIcon className="mr-2 h-4 w-4 animate-pulse" />
              Embedding...
            </>
          ) : currentStep === 'completed' ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Done
            </>
          ) : (
            <>Create Embedding</>
          )}
        </Button>
      </TableCell>
    </TableRow>
  )
}

export default EpubElement
