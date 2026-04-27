import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, Filter, Download, RefreshCw } from "lucide-react";

interface TableFiltersProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onFilter?: () => void;
}

export function TableFilters({ searchValue, onSearchChange, onRefresh, onExport, onFilter }: TableFiltersProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {onSearchChange && (
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      )}
      
      <div className="flex gap-2 ml-auto">
        {onFilter && (
          <Button variant="outline" size="sm" onClick={onFilter}>
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        )}
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
      </div>
    </div>
  );
}
