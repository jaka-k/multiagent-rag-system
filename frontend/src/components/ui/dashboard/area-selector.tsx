import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@ui/select.tsx'

import React from 'react'
import { Skeleton } from '@ui/skeleton.tsx'
import useAreaStore from '@context/area-store.tsx'
import { Area } from '@mytypes/types'

function AreaSelector() {
  const { activeArea, setActiveArea, areas, isLoading, error } = useAreaStore()

  if (isLoading) {
    return <Skeleton className="h-10 w-[180px]" />
  }

  return (
    <Select value={activeArea?.id} onValueChange={setActiveArea}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select area" />
      </SelectTrigger>
      <SelectContent>
        {!error &&
          areas?.map((area: Area) => (
            <SelectItem key={area.id} value={area.id}>
              {area.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}

export default AreaSelector
