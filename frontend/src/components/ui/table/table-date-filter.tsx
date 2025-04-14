'use client'

import { cn } from '@lib/utils'
import { Button } from '@ui/button'
import { Calendar } from '@ui/calendar'
import { Label } from '@ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, PlusCircleIcon } from 'lucide-react'
import * as React from 'react'

interface DateRangeFilterProps {
  column: any
  title: string | undefined
}

export function DateRangeFilter({ column, title }: DateRangeFilterProps) {
  const [startDate, setStartDate] = React.useState<Date | undefined>()
  const [endDate, setEndDate] = React.useState<Date | undefined>()

  // Function to update the filter value
  const updateFilterValue = (
    start: Date | undefined,
    end: Date | undefined
  ) => {
    // Convert dates to strings for the filter
    const startString = start ? format(start, 'yyyy-MM-dd') : undefined
    const endString = end ? format(end, 'yyyy-MM-dd') : undefined

    column?.setFilterValue([startString, endString])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2 h-8 border-dashed">
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          {title}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="start-date"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, 'dd. MM. yyyy')
                  ) : (
                    <span>dd. mm. yyyy</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date)
                    updateFilterValue(date, endDate)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="end-date"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? (
                    format(endDate, 'dd. MM. yyyy')
                  ) : (
                    <span>dd. mm. yyyy</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date)
                    updateFilterValue(startDate, date)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStartDate(undefined)
              setEndDate(undefined)
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
