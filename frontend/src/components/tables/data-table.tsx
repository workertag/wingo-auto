import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Filter,
  Loader2,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Listing<T> = {
  list: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
};

type FilterOption = {
  label: string;
  value: string | boolean;
};

type FilterConfig<T> = {
  key: keyof T | string;
  label: string;
  values: FilterOption[];
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[] | Listing<TData> | undefined;
  sortableColumns?: (keyof TData & string)[];
  defaultPageSize?: number;
  filters?: FilterConfig<TData>[];
  serverSide?: boolean;
  showSerialNumber?: boolean;
}

export function DataTable<TData, TValue>({
  data,
  columns,
  showSerialNumber = true,
  sortableColumns = [],
  defaultPageSize = 15,
  filters = [],
  serverSide = false,
}: DataTableProps<TData, TValue>) {
  const [isPending, startTransition] = useTransition();

  const isPaginatedData =
    data && !Array.isArray(data) && "list" in data && "pagination" in data;
  const tableData = isPaginatedData
    ? (data as Listing<TData>).list
    : (data as TData[]);
  const pagination = isPaginatedData
    ? (data as Listing<TData>).pagination
    : null;

  const filterKeys = filters.map((filter) => filter.key as string);

  // A single useQueryStates call batches every URL param write into one
  // navigation, so e.g. a sort change and its page reset always land
  // together instead of racing as separate updates.
  const [params, setParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      size: parseAsInteger.withDefault(defaultPageSize),
      search: parseAsString.withDefault(""),
      orderBy: parseAsString,
      order: parseAsString,
      ...Object.fromEntries(filterKeys.map((key) => [key, parseAsString])),
    },
    { history: "push" },
  );

  const page = params.page;
  const pageSize = params.size;
  const searchQuery = params.search;
  const orderBy = params.orderBy;
  const order = params.order;

  const setPage = (newPage: number) => setParams({ page: newPage });
  const setPageSize = (newSize: number) =>
    setParams({ size: newSize, page: 1 });

  const filterValues: Record<string, string> = {};
  const dynamicParams = params as unknown as Record<string, string | null>;
  for (const key of filterKeys) {
    filterValues[key] = dynamicParams[key] ?? "";
  }

  const setFilterValue = (key: string, value: string | null) => {
    setParams({ [key]: value || null, page: 1 });
  };

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>(() =>
    orderBy ? [{ id: orderBy, desc: (order || "desc") === "desc" }] : [],
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>(searchQuery || "");
  const [searchInput, setSearchInput] = useState<string>(searchQuery || "");

  const isInitialMount = useRef(true);
  const prevSorting = useRef<SortingState>(sorting);

  const isColumnSortable = (columnId: string): boolean =>
    sortableColumns.includes(columnId as keyof TData & string);

  const handleSearch = () => {
    if (searchInput.trim() !== searchQuery) {
      startTransition(() => {
        setParams({
          search: searchInput.trim() || null,
          ...(serverSide && { page: 1 }),
        });
        setGlobalFilter(searchInput.trim());
      });
    }
  };

  const handleClearSearch = () => {
    startTransition(() => {
      setSearchInput("");
      setGlobalFilter("");
      setParams({ search: null, ...(serverSide && { page: 1 }) });
    });
  };

  useEffect(() => {
    if (!serverSide) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevSorting.current = sorting;
      return;
    }
    const sortingChanged =
      JSON.stringify(sorting) !== JSON.stringify(prevSorting.current);
    prevSorting.current = sorting;
    if (!sortingChanged) return;
    startTransition(() => {
      if (sorting.length > 0 && sorting[0]) {
        const { id, desc } = sorting[0];
        if (id) {
          setParams({ orderBy: id, order: desc ? "desc" : "asc", page: 1 });
        }
      } else {
        setParams({ orderBy: null, order: null, page: 1 });
      }
    });
  }, [sorting, serverSide]);

  const table = useReactTable({
    data: tableData ?? [],
    columns:
      pagination && showSerialNumber
        ? [
            {
              id: "serial",
              header: "#",
              cell: ({ row }) =>
                (pagination.page - 1) * pagination.size + row.index + 1,
              size: 60,
              enableSorting: false,
              enableHiding: false,
            },
            ...columns,
          ]
        : columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: serverSide ? "" : globalFilter,
      columnVisibility,
      ...(!serverSide && { pagination: { pageIndex: page - 1, pageSize } }),
    },
    manualSorting: serverSide,
    manualFiltering: serverSide,
    manualPagination: serverSide,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    ...(!serverSide && {
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
    }),
  });

  const totalItems =
    serverSide && pagination
      ? pagination.total
      : table.getFilteredRowModel().rows.length;
  const currentPageSize = serverSide && pagination ? pagination.size : pageSize;
  const currentPage = serverSide && pagination ? pagination.page : page;
  const totalPages = Math.ceil(totalItems / currentPageSize) || 1;
  const hasNextPage =
    serverSide && pagination ? pagination.hasNext : table.getCanNextPage();
  const hasPrevPage =
    serverSide && pagination
      ? pagination.hasPrevious
      : table.getCanPreviousPage();
  const startItem =
    totalItems > 0 ? (currentPage - 1) * currentPageSize + 1 : 0;
  const endItem = Math.min(currentPage * currentPageSize, totalItems);

  return (
    <div className="space-y-4 md:space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-row items-center gap-2 flex-1 min-w-0">
          <div className="relative grow">
            <Input
              disabled={isPending}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search…"
              value={searchInput}
              className="border-amber-200/80 bg-white text-slate-800 placeholder-slate-400 focus-visible:ring-[var(--gmc-gold)]/20 focus-visible:border-[var(--gmc-gold)] font-semibold rounded-xl"
            />
            {searchInput && (
              <Button
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400 hover:text-slate-600"
                disabled={isPending}
                onClick={handleClearSearch}
                size="icon-sm"
                variant="ghost"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <Button
            disabled={isPending}
            onClick={handleSearch}
            size="sm"
            className="bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white font-bold hover:shadow-xs rounded-xl cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => {
            const filterKey = filter.key as string;
            const activeValue = filterValues[filterKey] || null;
            return (
              <DropdownMenu key={filterKey}>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={isPending}
                    size="sm"
                    variant="outline"
                    className="bg-white border-amber-200 text-slate-700 hover:bg-amber-50 hover:text-primary font-bold rounded-xl cursor-pointer"
                  >
                    <Filter className="h-4 w-4 mr-2 text-[var(--gmc-gold-deep)]" />
                    {filter.label}
                    {activeValue && (
                      <span className="ml-2 text-xs bg-amber-100 text-[var(--gmc-gold-ochre)] rounded-full px-2 py-0.5 font-bold">
                        {filter.values.find(
                          (o) => String(o.value) === activeValue,
                        )?.label ?? activeValue}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-40 bg-white border border-amber-100/80 rounded-2xl shadow-xl z-50"
                >
                  <DropdownMenuCheckboxItem
                    checked={!activeValue}
                    onCheckedChange={() => setFilterValue(filterKey, null)}
                    className="text-xs font-bold text-slate-800 cursor-pointer hover:bg-amber-50"
                  >
                    All
                  </DropdownMenuCheckboxItem>
                  {filter.values.map((option) => (
                    <DropdownMenuCheckboxItem
                      checked={activeValue === String(option.value)}
                      key={String(option.value)}
                      onCheckedChange={() =>
                        setFilterValue(filterKey, String(option.value))
                      }
                      className="text-xs font-bold text-slate-800 cursor-pointer hover:bg-amber-50"
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={isPending}
                size="sm"
                variant="outline"
                className="bg-white border-amber-200 text-slate-700 hover:bg-amber-50 hover:text-black font-bold rounded-xl cursor-pointer"
              >
                <Settings2 className="h-4 w-4 mr-2 text-[var(--gmc-gold-deep)]" />
                Columns
                <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-40 bg-white border border-amber-100/80 rounded-2xl shadow-xl z-50"
            >
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    checked={column.getIsVisible()}
                    className="capitalize text-xs font-bold text-slate-800 cursor-pointer hover:bg-amber-50"
                    key={column.id}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id.replace(/([A-Z])/g, " $1").trim()}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-amber-200/50 bg-white/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-amber-50/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  className="hover:bg-transparent border-amber-100"
                  key={headerGroup.id}
                >
                  {headerGroup.headers.map((header) => {
                    const canSort = isColumnSortable(header.column.id);
                    return (
                      <TableHead
                        className="font-extrabold text-slate-700 py-3.5 text-xs tracking-wider"
                        key={header.id}
                        style={
                          {
                            width:
                              header.getSize() !== 150
                                ? header.getSize()
                                : undefined,
                          } as React.CSSProperties
                        }
                      >
                        {!header.isPlaceholder && (
                          <div
                            role="tab"
                            tabIndex={-87}
                            className={cn(
                              "flex items-center gap-2",
                              canSort &&
                                "cursor-pointer select-none hover:text-[var(--gmc-gold-deep)] transition-colors",
                            )}
                            onClick={
                              canSort
                                ? header.column.getToggleSortingHandler()
                                : undefined
                            }
                            onKeyDown={
                              canSort
                                ? header.column.getToggleSortingHandler()
                                : undefined
                            }
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {canSort &&
                              ({
                                asc: (
                                  <ChevronUp className="h-4 w-4 text-[var(--gmc-gold-deep)]" />
                                ),
                                desc: (
                                  <ChevronDown className="h-4 w-4 text-[var(--gmc-gold-deep)]" />
                                ),
                              }[header.column.getIsSorted() as string] ?? (
                                <ChevronsUpDown className="h-4 w-4 opacity-30" />
                              ))}
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isPending && (
                <TableRow>
                  <TableCell
                    className="h-32 text-center bg-white"
                    colSpan={
                      columns.length + (showSerialNumber && pagination ? 1 : 0)
                    }
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[var(--gmc-gold)]" />
                      <p className="text-sm font-bold text-slate-500">
                        Loading…
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isPending && tableData?.length
                ? table.getRowModel().rows.map((row, index) => (
                    <TableRow
                      className={cn(
                        "border-amber-100/50 transition-colors",
                        index % 2 === 0
                          ? "bg-white hover:bg-amber-50/10"
                          : "bg-amber-50/10 hover:bg-amber-50/20",
                      )}
                      key={row.id}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          className="py-3.5 text-slate-800 font-semibold text-xs sm:text-sm"
                          key={cell.id}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : !isPending && (
                    <TableRow>
                      <TableCell
                        className="h-32 text-center bg-white"
                        colSpan={
                          columns.length +
                          (showSerialNumber && pagination ? 1 : 0)
                        }
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Search className="h-8 w-8 text-slate-400" />
                          <p className="text-sm font-bold text-slate-500">
                            No results found.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 text-slate-700">
        <div className="text-sm font-semibold text-slate-500">
          Showing{" "}
          <span className="font-extrabold text-slate-800">
            {startItem}–{endItem}
          </span>{" "}
          of{" "}
          <span className="font-extrabold text-slate-800">
            {totalItems.toLocaleString()}
          </span>{" "}
          entries
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">
              Rows:
            </span>
            <Select
              disabled={isPending}
              onValueChange={(value) => setPageSize(Number(value))}
              value={currentPageSize.toString()}
            >
              <SelectTrigger
                className="h-8 w-18 border-amber-200 text-slate-800 font-bold hover:bg-amber-50 cursor-pointer"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-amber-100 rounded-xl shadow-md z-50 font-bold text-slate-800">
                {[10, 15, 20, 30].map((s) => (
                  <SelectItem
                    key={s}
                    value={String(s)}
                    className="cursor-pointer hover:bg-amber-50"
                  >
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              className="h-8 px-3 bg-white border-amber-200 text-slate-700 hover:bg-amber-50 rounded-lg cursor-pointer transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:opacity-100"
              disabled={!hasPrevPage || isPending}
              onClick={() => setPage(currentPage - 1)}
              size="sm"
              variant="outline"
            >
              Prev
            </Button>
            <span className="text-xs px-3.5 py-1.5 bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white rounded-lg min-w-20 text-center font-bold shadow-2xs">
              {currentPage} / {totalPages}
            </span>
            <Button
              className="h-8 px-3 bg-white border-amber-200 text-slate-700 hover:bg-amber-50 rounded-lg cursor-pointer transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:opacity-100"
              disabled={!hasNextPage || isPending}
              onClick={() => setPage(currentPage + 1)}
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
