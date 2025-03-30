import { Column } from '@tanstack/react-table'
import { Badge } from '@ui/badge'
import { Button } from '@ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Separator } from '@ui/separator'
import { CheckIcon, PlusCircleIcon } from 'lucide-react'
import React from 'react'

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options?: {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
  type?: 'string' | 'number' | 'date'
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options = [],
  type = 'string'
}: DataTableFacetedFilterProps<TData, TValue>) {
  if (type === 'number') {
    // Number comparison filter
    const [operator, setOperator] = React.useState<'greaterThan' | 'lessThan'>(
      'greaterThan'
    )
    const [numberValue, setNumberValue] = React.useState<number | undefined>()

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="ml-2 h-8 border-dashed"
          >
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            {title}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-4" align="start">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Filter</label>
            <select
              className="w-full rounded-md border-gray-300"
              value={operator}
              onChange={(e) => {
                const value = e.target.value as 'greaterThan' | 'lessThan'
                setOperator(value)
                column?.setFilterValue({
                  operator: value,
                  value: numberValue
                })
              }}
            >
              <option value="greaterThan">Greater than</option>
              <option value="lessThan">Less than</option>
            </select>
            <input
              type="number"
              className="w-full rounded-md border-gray-300"
              value={numberValue ?? ''}
              onChange={(e) => {
                const value = e.target.value
                  ? Number(e.target.value)
                  : undefined
                setNumberValue(value)
                column?.setFilterValue({
                  operator,
                  value
                })
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOperator('greaterThan')
                setNumberValue(undefined)
                column?.setFilterValue(undefined)
              }}
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  if (type === 'date') {
    // Date range filter
    const [startDate, setStartDate] = React.useState<string | undefined>()
    const [endDate, setEndDate] = React.useState<string | undefined>()

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="ml-2 h-8 border-dashed"
          >
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            {title}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-4" align="start">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Start Date</label>
            <input
              type="date"
              className="w-full rounded-md border-gray-300"
              value={startDate ?? ''}
              onChange={(e) => {
                const value = e.target.value || undefined
                setStartDate(value)
                column?.setFilterValue(
                  (old: [string | undefined, string | undefined]) => [
                    value,
                    old?.[1]
                  ]
                )
              }}
            />
            <label className="block text-sm font-medium">End Date</label>
            <input
              type="date"
              className="w-full rounded-md border-gray-300"
              value={endDate ?? ''}
              onChange={(e) => {
                const value = e.target.value || undefined
                setEndDate(value)
                column?.setFilterValue(
                  (old: [string | undefined, string | undefined]) => [
                    old?.[0],
                    value
                  ]
                )
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate(undefined)
                setEndDate(undefined)
                column?.setFilterValue(undefined)
              }}
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Existing string and array filter code
  const facets = column?.getFacetedUniqueValues()
  const selectedValues = new Set(column?.getFilterValue() as string[])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2 h-8 border-dashed">
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Filter ${title}`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value)
                      } else {
                        selectedValues.add(option.value)
                      }

                      const filterValues = Array.from(selectedValues)
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined
                      )
                    }}
                  >
                    <div
                      className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50'
                      }`}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                    {facets?.get(option.value) && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {facets.get(option.value)}
                      </span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
