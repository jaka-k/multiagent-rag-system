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
  dateBetween,
  getColumns,
  numberComparison
} from '@components/ui/table/table-schemas'
import useAreaStore from '@context/area-store.tsx'
import useChatStore from '@context/chats-store.tsx'
import { Chat } from '@mytypes/types'
import {
  ColumnFilter,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from '@tanstack/react-table'
import CreateChat from '@ui/create-chat/create-chat.tsx'
import { PlusIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const ChatTable = () => {
  const { chats, fetchChatsForUser, isLoading, error } = useChatStore()
  const { areas } = useAreaStore()
  const router = useRouter()
  const [openModal, setOpenModal] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([])
  const [globalFilter, setGlobalFilter] = useState('')

  useEffect(() => {
    fetchChatsForUser()
  }, [])

  const areaColorMap: Record<string, { label: string; color: string }> =
    useMemo(() => {
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
      const map: Record<string, { label: string; color: string }> = {}
      areas.forEach((area, index) => {
        map[area.id] = {
          label: area.label,
          color: labelColorClasses[index % labelColorClasses.length]
        }
      })
      return map
    }, [areas])

  const columns = useMemo(
    () =>
      getColumns((areaId) => ({
        label: areaColorMap[areaId]?.label ?? 'Unknown',
        color: areaColorMap[areaId]?.color ?? 'bg-gray-100 text-gray-800'
      })),
    [areaColorMap]
  )

  const filterFns = {
    dateBetween,
    numberComparison
  }

  const table = useReactTable<Chat>({
    data: chats,
    columns,
    state: {
      columnFilters,
      globalFilter,
      pagination
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns
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

  const labelOptions = areas.map((area) => ({
    label: area.label,
    value: area.id
  }))

  const statusColumn = table.getColumn('status')
  const labelColumn = table.getColumn('areaId')
  const totalTokensColumn = table.getColumn('totalTokens')
  const lastUpdatedColumn = table.getColumn('lastUpdated')

  return (
    <div className="space-y-4">
      <div className="flex items-center py-4 space-x-2">
        <Button
          onClick={() => setOpenModal(true)}
          className="bg-black pr-4"
          variant="default"
          size="sm"
        >
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
        {totalTokensColumn && (
          <DataTableFacetedFilter
            column={totalTokensColumn}
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
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <span className="text-muted-foreground animate-pulse">
                    Loading chats...
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && error && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-red-500"
                >
                  Failed to retrieve the chats from the backend.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !error &&
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
              ))}
          </TableBody>
        </Table>
      </div>
      <TablePagination table={table} />
      <CreateChat open={openModal} setOpen={setOpenModal} />
    </div>
  )
}

export default ChatTable
