import { cn } from '@lib/utils'
import React from 'react'

export const StatusIndicator: ({
  isConnected
}: {
  isConnected: boolean
}) => React.JSX.Element = ({ isConnected }: { isConnected: boolean }) => (
  <div
    className={cn(
      'text-xs font-medium px-2 py-1 rounded-md',
      isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    )}
  >
    {isConnected ? 'Connected' : 'Disconnected'}
  </div>
)
