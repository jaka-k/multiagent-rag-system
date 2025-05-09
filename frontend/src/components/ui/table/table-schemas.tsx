import { Chat } from '@mytypes/types'
import { ColumnDef, FilterFn } from '@tanstack/react-table'
import { CheckCircleIcon, LucideIcon, XCircleIcon } from 'lucide-react'
import { z } from 'zod'

type StatusType = 'active' | 'non-active'

export const tableSchema = z.object({
  id: z.string(),
  label: z.string(),
  title: z.string(),
  status: z.enum(['active', 'non-active']),
  totalTokens: z.number(),
  lastUpdated: z.string()
})

const statusMappings: Record<StatusType, { label: string; icon: LucideIcon }> =
  {
    active: {
      label: 'Active',
      icon: CheckCircleIcon
    },
    'non-active': {
      label: 'Non-Active',
      icon: XCircleIcon
    }
  }

type NumberFilterValue = {
  operator: 'greaterThan' | 'lessThan'
  value: number | undefined
}

export const numberComparison: FilterFn<Chat> = (
  row,
  columnId,
  filterValue
) => {
  const cellValue = row.getValue<number>(columnId)
  const { operator, value } = filterValue as NumberFilterValue

  if (value === undefined) return true

  if (operator === 'greaterThan') {
    return cellValue > value
  }

  if (operator === 'lessThan') {
    return cellValue < value
  }

  return true
}

export const dateBetween: FilterFn<Chat> = (row, columnId, filterValue) => {
  const cellValue = new Date(row.getValue<string>(columnId))
  const [start, end] = filterValue as [string | undefined, string | undefined]

  if (start && end) {
    return cellValue >= new Date(start) && cellValue <= new Date(end)
  }

  if (start) {
    return cellValue >= new Date(start)
  }

  if (end) {
    return cellValue <= new Date(end)
  }

  return true
}

// Define columns for the table
export const getColumns = (
  getAreaMeta: (areaId: string) => { label: string; color: string }
): ColumnDef<Chat>[] => [
  {
    accessorKey: 'id',
    header: 'ID',
    filterFn: 'includesString',
    cell: ({ row }) => (
      <span className="text-slate-600 text-xs">{row.getValue('id')}</span>
    )
  },
  {
    accessorKey: 'areaId',
    header: 'Area',
    cell: ({ getValue }) => {
      const areaId = getValue<string>()
      const meta = getAreaMeta(areaId)
      return (
        <span
          className={`px-2 py-1 rounded-full text-sm font-medium ${meta.color}`}
        >
          {meta.label}
        </span>
      )
    },
    filterFn: 'arrIncludes'
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => <span>{row.getValue('title')}</span>,
    filterFn: 'includesString'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const statusValue = getValue() as StatusType
      const statusInfo = statusMappings[statusValue]
      return (
        <div className="flex items-center">
          <span>{statusInfo?.label}</span>
          {statusInfo && (
            <statusInfo.icon className="ml-2 h-4 w-4 text-muted-foreground" />
          )}
        </div>
      )
    },
    filterFn: 'arrIncludes'
  },
  {
    accessorKey: 'totalTokens',
    header: 'Tokens Used',
    cell: ({ getValue }) => getValue<number>().toLocaleString(),
    filterFn: numberComparison
  },
  {
    accessorKey: 'lastUpdated',
    header: 'Last Updated',
    cell: ({ getValue }) => <span>{getValue<string>()}</span>,
    filterFn: dateBetween
  }
]
