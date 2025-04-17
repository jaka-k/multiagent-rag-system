'use client'

import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Label } from '@ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { PlusCircleIcon } from 'lucide-react'
import * as React from 'react'

interface NumberFilterProps {
  column: any
  title: string | undefined
}

export function NumberFilter({ column, title }: NumberFilterProps) {
  const [operator, setOperator] = React.useState<'greaterThan' | 'lessThan'>(
    'greaterThan'
  )
  const [numberValue, setNumberValue] = React.useState<number | undefined>()

  // Function to update the filter value
  const updateFilterValue = (
    op: 'greaterThan' | 'lessThan',
    value: number | undefined
  ) => {
    column?.setFilterValue({
      operator: op,
      value: value
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2 h-8 border-dashed">
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          {title}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-4">
            <Label htmlFor="operator-select">Filter</Label>
            <Select
              value={operator}
              onValueChange={(value: 'greaterThan' | 'lessThan') => {
                setOperator(value)
                updateFilterValue(value, numberValue)
              }}
            >
              <SelectTrigger id="operator-select">
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="greaterThan">Greater than</SelectItem>
                <SelectItem value="lessThan">Less than</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label htmlFor="number-input">Value</Label>
            <Input
              id="number-input"
              type="number"
              value={numberValue ?? ''}
              onChange={(e) => {
                const value = e.target.value
                  ? Number(e.target.value)
                  : undefined
                setNumberValue(value)
                updateFilterValue(operator, value)
              }}
              className="w-full"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOperator('greaterThan')
              setNumberValue(undefined)
              column?.setFilterValue(undefined)
            }}
            className="w-full"
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
