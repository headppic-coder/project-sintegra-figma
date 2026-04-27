import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "./utils"
import { Button } from "./button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface Region {
  id: string
  kotaKabupaten: string
  provinsi: string
}

interface CityComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  regions: Region[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CityCombobox({
  value,
  onValueChange,
  regions,
  placeholder = "Pilih kota...",
  disabled = false,
  className
}: CityComboboxProps) {
  const [open, setOpen] = React.useState(false)

  // Group regions by province
  const regionsByProvince = React.useMemo(() => {
    const grouped: Record<string, Region[]> = {}
    regions.forEach((region) => {
      if (!grouped[region.provinsi]) {
        grouped[region.provinsi] = []
      }
      grouped[region.provinsi].push(region)
    })
    // Sort provinces alphabetically
    return Object.keys(grouped)
      .sort()
      .reduce((acc, province) => {
        acc[province] = grouped[province].sort((a, b) =>
          a.kotaKabupaten.localeCompare(b.kotaKabupaten)
        )
        return acc
      }, {} as Record<string, Region[]>)
  }, [regions])

  const selectedRegion = React.useMemo(() => {
    return regions.find((region) => region.kotaKabupaten === value)
  }, [regions, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedRegion
              ? `${selectedRegion.kotaKabupaten}, ${selectedRegion.provinsi}`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari kota atau provinsi..." />
          <CommandList>
            <CommandEmpty>Tidak ada kota yang ditemukan.</CommandEmpty>
            {Object.entries(regionsByProvince).map(([province, provinceRegions]) => (
              <CommandGroup key={province} heading={province}>
                {provinceRegions.map((region) => (
                  <CommandItem
                    key={region.id}
                    value={`${region.kotaKabupaten} ${region.provinsi}`}
                    onSelect={() => {
                      onValueChange?.(region.kotaKabupaten)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === region.kotaKabupaten ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {region.kotaKabupaten}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
