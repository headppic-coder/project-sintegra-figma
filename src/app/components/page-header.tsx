import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { Button } from "./ui/button";
import { Plus, LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  description?: string;
  icon?: LucideIcon;
  onAdd?: () => void;
  addLabel?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, breadcrumbs, description, icon: Icon, onAdd, addLabel = "Tambah", actions }: PageHeaderProps) {
  return (
    <div className="mb-3">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb className="mb-2">
          <BreadcrumbList className="text-xs">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage className="text-xs">{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href || '#'} className="text-xs">{crumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="w-7 h-7 bg-primary/10 rounded flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {actions}
          {onAdd && (
            <Button onClick={onAdd} size="sm" className="bg-primary hover:bg-primary/90 h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {addLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}