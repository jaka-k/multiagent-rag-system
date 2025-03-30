'use client'

import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@components/ui/table/table'
import { DataTableFacetedFilter } from '@components/ui/table/table-faceted-filter'
import { TablePagination } from '@components/ui/table/table-pagination'
import {
  Chat,
  dateBetween,
  getColumns,
  numberComparison
} from '@components/ui/table/table-schemas'
import {
  ColumnFilter,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { placeholderTable } from '../../../mock/mockData'

const ChatTable = () => {
  const data = placeholderTable
  const router = useRouter()
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // Collect unique labels from the data
  const labels = useMemo(
    () => Array.from(new Set(data.map((chat) => chat.label))),
    [data]
  )
  const labelColorMap: Record<string, string> = useMemo(() => {
    const labelColorClasses = [
      'bg-cyan-100 text-cyan-800',
      'bg-teal-100 text-teal-800',
      'bg-fuchsia-100 text-fuchsia-800',
      'bg-lime-100 text-lime-800',
      'bg-amber-100 text-amber-800',
      'bg-purple-100 text-purple-800',
      'bg-stone-100 text-stone-800',
      'bg-indigo-100 text-indigo-800',
      'bg-sky-100 text-sky-800'
    ]
    const map: Record<string, string> = {}
    labels.forEach((label, index) => {
      map[label] = labelColorClasses[index % labelColorClasses.length]
    })
    return map
  }, [labels])

  // Get columns with getLabelColorClass
  const columns = useMemo(
    () => getColumns((label: string) => labelColorMap[label]),
    [labelColorMap]
  )

  const filterFns = {
    dateBetween,
    numberComparison
  }

  const table = useReactTable<Chat>({
    data,
    columns,
    state: {
      columnFilters,
      globalFilter
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns,
    initialState: {
      pagination: {
        pageSize: 10 // Show 10 chats per page
      }
    }
  })

  const statusOptions = [
    {
      label: 'Active',
      value: 'active'
    },
    {
      label: 'Non-Active',
      value: 'non-active'
    }
  ]

  const labelOptions = labels.map((label) => ({
    label,
    value: label
  }))

  const statusColumn = table.getColumn('status')
  const labelColumn = table.getColumn('label')
  const tokensUsedColumn = table.getColumn('tokensUsed')
  const lastUpdatedColumn = table.getColumn('lastUpdated')

  return (
    <div className="space-y-4">
      <div className="flex items-center py-4 space-x-2">
        <Button className="bg-black pr-4" variant="default" size="sm">
          <PlusIcon className="mr-2 h-4 w-4" />
          New Chat
        </Button>
        <Input
          placeholder="Search chats..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        {/* Render filters next to the input field */}
        {statusColumn && (
          <DataTableFacetedFilter
            column={statusColumn}
            title="Status"
            options={statusOptions}
          />
        )}
        {labelColumn && (
          <DataTableFacetedFilter
            column={labelColumn}
            title="Label"
            options={labelOptions}
          />
        )}
        {tokensUsedColumn && (
          <DataTableFacetedFilter
            column={tokensUsedColumn}
            title="Tokens Used"
            type="number"
          />
        )}
        {lastUpdatedColumn && (
          <DataTableFacetedFilter
            column={lastUpdatedColumn}
            title="Last Updated"
            type="date"
          />
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => router.push(`/chat/${row.original.id}`)}
                  className="cursor-pointer hover:bg-gray-100"
                  tabIndex={0}
                  role="button"
                  aria-label={`View chat ${row.original.id}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination table={table} />
    </div>
  )
}

export default ChatTable
