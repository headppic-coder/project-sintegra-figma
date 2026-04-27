import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import { Card } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface CustomAction {
  icon: React.ReactNode;
  onClick: (row: any) => void;
  label?: string;
  variant?: 'default' | 'ghost' | 'destructive';
  className?: string;
  shouldShow?: (row: any) => boolean; // Conditional rendering for action
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  onDetail?: (row: any) => void; // Alias for onView (backward compatibility)
  customActions?: CustomAction[];
  loading?: boolean;
  getStatusColor?: (row: any) => string; // Function untuk menentukan warna status
}

export function DataTable({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  onDetail, // Support onDetail as alias
  customActions,
  loading,
  getStatusColor
}: DataTableProps) {
  // Use onView or onDetail (onDetail is alias for backward compatibility)
  const handleView = onView || onDetail;

  // Detect date column from columns (createdAt, tanggal, created_at, etc.)
  const detectDateColumn = () => {
    const dateColumns = ['createdAt', 'created_at', 'tanggal', 'date', 'updatedAt', 'updated_at'];
    for (const col of columns) {
      if (dateColumns.includes(col.key)) {
        return col.key;
      }
    }
    return null;
  };

  // Auto sort by date column in descending order (newest first)
  const sortedData = useMemo(() => {
    const dateColumn = detectDateColumn();
    if (!dateColumn) return data;

    return [...data].sort((a, b) => {
      let aValue = a[dateColumn];
      let bValue = b[dateColumn];

      // Handle undefined/null
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      // Parse and compare dates - descending order (newest first)
      const dateA = new Date(aValue).getTime();
      const dateB = new Date(bValue).getTime();
      return dateB - dateA; // Descending
    });
  }, [data, columns]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Memuat data...</div>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Tidak ada data</div>
        </div>
      </Card>
    );
  }

  // Default status color mapper
  const defaultGetStatusColor = (row: any) => {
    try {
      if (!row) return 'bg-blue-500';
      const status = row.status ? String(row.status).toLowerCase() : '';
      if (!status) return 'bg-blue-500'; // default jika tidak ada status
      if (status === 'active' || status === 'aktif' || status === 'approved') return 'bg-green-500';
      if (status === 'inactive' || status === 'tidak aktif' || status === 'nonaktif') return 'bg-gray-400';
      if (status === 'pending' || status === 'proses') return 'bg-yellow-500';
      if (status === 'rejected' || status === 'ditolak') return 'bg-red-500';
      return 'bg-blue-500'; // default
    } catch (error) {
      console.error('Error in defaultGetStatusColor:', error);
      return 'bg-blue-500'; // safe fallback
    }
  };

  const getEyeColor = (row: any) => {
    try {
      if (!row) return 'bg-blue-500';
      if (getStatusColor) {
        return getStatusColor(row);
      }
      return defaultGetStatusColor(row);
    } catch (error) {
      console.error('Error in getEyeColor:', error);
      return 'bg-blue-500'; // safe fallback
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="border-collapse border">
          <TableHeader>
            <TableRow className="bg-muted/50 border-b border-t">
              {(handleView || onEdit || onDelete || customActions) && (
                <TableHead className="w-[50px] font-medium text-xs h-auto border-r border-l text-center">Aksi</TableHead>
              )}
              {columns.map((column, index) => (
                <TableHead key={column.key} className={`font-medium text-xs h-auto border-r ${index === 0 && !(handleView || onEdit || onDelete || customActions) ? 'border-l' : ''}`}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row, rowIndex) => (
              <TableRow key={row.id || rowIndex} className="hover:bg-muted/30 border-b">
                {(handleView || onEdit || onDelete || customActions) && (
                  <TableCell className="py-1 border-r border-l text-center">
                    <div className="flex items-center justify-center">
                      {/* Dropdown Menu dengan Icon Mata */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 p-0 ${getEyeColor(row)}`}
                            title="Lihat aksi"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          {/* Detail/View */}
                          {handleView && (
                            <DropdownMenuItem onClick={() => handleView(row)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Detail
                            </DropdownMenuItem>
                          )}

                          {/* Custom Actions */}
                          {customActions && customActions
                            .filter(action => !action.shouldShow || action.shouldShow(row))
                            .map((action, idx) => (
                              <DropdownMenuItem
                                key={idx}
                                onClick={() => action.onClick(row)}
                                className={action.variant === 'destructive' ? 'text-destructive' : ''}
                              >
                                <span className="mr-2">{action.icon}</span>
                                {action.label || 'Aksi'}
                              </DropdownMenuItem>
                            ))}

                          {/* Separator after custom actions */}
                          {customActions && customActions.filter(action => !action.shouldShow || action.shouldShow(row)).length > 0 && (handleView || onEdit) && <DropdownMenuSeparator />}

                          {/* Edit */}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(row)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}

                          {/* Separator sebelum Hapus */}
                          {onDelete && (handleView || onEdit || customActions) && <DropdownMenuSeparator />}

                          {/* Hapus */}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(row)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                )}
                {columns.map((column, index) => (
                  <TableCell key={`${rowIndex}-${column.key}`} className={`py-1 text-xs border-r ${index === 0 && !(handleView || onEdit || onDelete || customActions) ? 'border-l' : ''}`}>
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key] || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}