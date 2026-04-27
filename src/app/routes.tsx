import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/main-layout";
import { SimpleProtectedRoute } from "./components/simple-protected-route";
import { SimpleLogin } from "./pages/simple-login";
import { Dashboard } from "./pages/dashboard";
import { TestData } from "./pages/test-data";
import { TestDelete } from "./pages/test-delete";
import { Documentation } from "./pages/documentation";
import SystemStatus from "./pages/system-status";

// Sales Module - Import from index
import {
  ProspectiveCustomers,
  Customers,
  Pipeline,
  PipelineWrapper,
  PriceFormula,
  Quotations,
  SalesOrders,
  SalesOrderItems,
  DeliveryRequests,
  DeliveryNotes,
  DeliveryRecap,
  LeadSources,
  Regions,
  PipelineStages,
  SalesActivities,
  Segments,
  PipelineDetail,
  PipelineFollowUps,
  ActivityByType,
  CustomerPipeline,
  SalesActivityReport,
  KlaimBBM,
  LogHistori,
  CustomItems,
  QuotationDetail,
  QuotationApprovals
} from "./pages/sales";
import { CustomerForm } from "./pages/sales/customer-form";
import { PipelineForm } from "./pages/sales/pipeline-form";
import { QuotationForm } from "./pages/sales/quotation-form";
import { RegionForm } from "./pages/sales/region-form";

// Design Module - Import from index
import {
  DesignRequests,
  DesignProcess,
  DesignLibrary,
  DesignLayout,
  LayoutJoblist,
  CylinderRegistry,
  PlateRegistry,
  ArtworkSpecification,
  PrepressChecklist
} from "./pages/design";

// PPIC Module - Import from index
import {
  ProcessStages,
  ProductionPlans,
  ProductionSchedule,
  PlanningCapacity,
  ScheduleMonitoring,
  MaterialMonitoring,
  MaterialUsageMonitoring,
  ProductionCompletion,
  CompletionList
} from "./pages/ppic";

// Production Module - Import from index
import {
  ProcessUnits,
  ShiftPlan,
  ProductionRealization,
  RealizationMonitoring,
  Productivity,
  Downtime,
  ProductionRealtime,
  Machines,
  MachineMaintenance,
  OvertimeRequest,
  QCProcess,
  QCIncoming,
  QCOutgoing
} from "./pages/production";

// Warehouse Module - Import from index
import {
  ItemRequests,
  ItemReceipts,
  MaterialPreparation,
  ProductionOutgoing,
  ProductionIncoming,
  Items,
  ItemCategories,
  ItemTypes,
  Warehouses,
  StockCard,
  StockMovements,
  StockAdjustment,
  ToolRegistry,
  MinMaxStock,
  StockReport
} from "./pages/warehouse";

// HRGA Module - Import from index
import {
  Employees,
  MasterCompanies,
  MasterDepartments,
  MasterPositions,
  OrganizationStructure,
  Divisions,
  SubDivisions,
  KPI,
  MasterShift,
  Recruitment,
  WarningLetters,
  DocumentManagement,
  SecurityReports,
  JanitorReports,
  Assets,
  AssetRepair,
  OfficeSupplyRequest
} from "./pages/hrga";

// Master Module
import { DatabaseSchema } from "./pages/master/database-schema";
import { ProductTypes } from "./pages/master/product-types";
import PriceFormulaPolos from "./pages/master/price-formula-polos";
import PriceFormulaOffset from "./pages/master/price-formula-offset";
import PriceFormulaBoks from "./pages/master/price-formula-boks";
import PriceFormulaRoto from "./pages/master/price-formula-roto";

// System Module
import { AccessSettings } from "./pages/system/access-settings";
import AccurateIntegration from "./pages/system/accurate-integration";
import { DatabaseStats } from "./pages/system/database-stats";

// Procurement Module - Import from index
import {
  VendorRegistration,
  PurchaseOrders,
  Suppliers,
  SupplierEvaluation,
  PurchaseReturns,
  PurchasePayments,
  SupplierQuotations
} from "./pages/procurement";

// Inventory Module - Import from index
import {
  JenisBarangPage,
  KategoriBarangPage,
  SubKategoriBarangPage
} from "./pages/inventory";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <SimpleLogin />,
  },
  {
    path: "/",
    element: (
      <SimpleProtectedRoute>
        <MainLayout />
      </SimpleProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "test-data", Component: TestData },
      { path: "test-delete", Component: TestDelete },
      { path: "documentation", Component: Documentation },
      { path: "system-status", Component: SystemStatus },

      // System Routes
      { path: "system/access-settings", Component: AccessSettings },
      { path: "system/accurate-integration", Component: AccurateIntegration },
      { path: "system/database-stats", Component: DatabaseStats },

      // Sales Routes
      { path: "sales/prospective-customers", Component: ProspectiveCustomers },
      { path: "sales/customers", Component: Customers },
      { path: "sales/customers/add", Component: CustomerForm },
      { path: "sales/customers/:id/edit", Component: CustomerForm },

      // Pipeline Routes with Tabs
      {
        path: "sales/pipeline",
        Component: PipelineWrapper,
        children: [
          { index: true, Component: Pipeline },
          { path: "new", Component: PipelineForm },
          { path: "detail/:id", Component: PipelineDetail },
          { path: "customer-pipeline", Component: CustomerPipeline },
          { path: "sales-activity", Component: SalesActivityReport },
          { path: "activity-by-type", Component: ActivityByType },
          { path: "klaim-bbm", Component: KlaimBBM },
          { path: "log-histori", Component: LogHistori },
          { path: ":id", Component: PipelineForm },
        ],
      },

      { path: "sales/pipeline-followups", Component: PipelineFollowUps },
      { path: "sales/price-formula", Component: PriceFormula },
      { path: "sales/quotations", Component: Quotations },
      { path: "sales/quotations/new", Component: QuotationForm },
      { path: "sales/quotations/:id/detail", Component: QuotationDetail },
      { path: "sales/quotations/:id", Component: QuotationForm },
      { path: "sales/quotations/:id/edit", Component: QuotationForm },
      { path: "sales/sales-orders", Component: SalesOrders },
      { path: "sales/sales-order-items", Component: SalesOrderItems },
      { path: "sales/delivery-requests", Component: DeliveryRequests },
      { path: "sales/delivery-notes", Component: DeliveryNotes },
      { path: "sales/delivery-recap", Component: DeliveryRecap },
      { path: "sales/custom-items", Component: CustomItems },
      { path: "sales/lead-sources", Component: LeadSources },
      { path: "sales/regions", Component: Regions },
      { path: "sales/regions/new", Component: RegionForm },
      { path: "sales/regions/:id", Component: RegionForm },
      { path: "sales/pipeline-stages", Component: PipelineStages },
      { path: "sales/sales-activities", Component: SalesActivities },
      { path: "sales/segments", Component: Segments },
      
      // Design Routes
      { path: "design/design-requests", Component: DesignRequests },
      { path: "design/design-process", Component: DesignProcess },
      { path: "design/design-library", Component: DesignLibrary },
      { path: "design/design-layout", Component: DesignLayout },
      { path: "design/layout-joblist", Component: LayoutJoblist },
      { path: "design/cylinder-registry", Component: CylinderRegistry },
      { path: "design/plate-registry", Component: PlateRegistry },
      { path: "design/artwork-specification", Component: ArtworkSpecification },
      { path: "design/prepress-checklist", Component: PrepressChecklist },
      
      // PPIC Routes
      { path: "ppic/process-stages", Component: ProcessStages },
      { path: "ppic/production-plans", Component: ProductionPlans },
      { path: "ppic/production-schedule", Component: ProductionSchedule },
      { path: "ppic/planning-capacity", Component: PlanningCapacity },
      { path: "ppic/schedule-monitoring", Component: ScheduleMonitoring },
      { path: "ppic/material-monitoring", Component: MaterialMonitoring },
      { path: "ppic/material-usage-monitoring", Component: MaterialUsageMonitoring },
      { path: "ppic/production-completion", Component: ProductionCompletion },
      { path: "ppic/completion-list", Component: CompletionList },
      
      // Production Routes
      { path: "production/process-units", Component: ProcessUnits },
      { path: "production/shift-plan", Component: ShiftPlan },
      { path: "production/production-realization", Component: ProductionRealization },
      { path: "production/realization-monitoring", Component: RealizationMonitoring },
      { path: "production/productivity", Component: Productivity },
      { path: "production/downtime", Component: Downtime },
      { path: "production/production-realtime", Component: ProductionRealtime },
      { path: "production/machines", Component: Machines },
      { path: "production/machine-maintenance", Component: MachineMaintenance },
      { path: "production/overtime-request", Component: OvertimeRequest },
      { path: "production/qc-process", Component: QCProcess },
      { path: "production/qc-incoming", Component: QCIncoming },
      { path: "production/qc-outgoing", Component: QCOutgoing },
      
      // Warehouse Routes
      { path: "warehouse/item-requests", Component: ItemRequests },
      { path: "warehouse/item-receipts", Component: ItemReceipts },
      { path: "warehouse/material-preparation", Component: MaterialPreparation },
      { path: "warehouse/production-outgoing", Component: ProductionOutgoing },
      { path: "warehouse/production-incoming", Component: ProductionIncoming },
      { path: "warehouse/items", Component: Items },
      { path: "warehouse/item-categories", Component: ItemCategories },
      { path: "warehouse/item-types", Component: ItemTypes },
      { path: "warehouse/warehouses", Component: Warehouses },
      { path: "warehouse/stock-card", Component: StockCard },
      { path: "warehouse/stock-movements", Component: StockMovements },
      { path: "warehouse/stock-adjustment", Component: StockAdjustment },
      { path: "warehouse/tool-registry", Component: ToolRegistry },
      { path: "warehouse/min-max-stock", Component: MinMaxStock },
      { path: "warehouse/stock-report", Component: StockReport },
      
      // HRGA Routes
      { path: "hrga/employees", Component: Employees },
      { path: "hrga/master-companies", Component: MasterCompanies },
      { path: "hrga/master-departments", Component: MasterDepartments },
      { path: "hrga/master-positions", Component: MasterPositions },
      { path: "hrga/organization-structure", Component: OrganizationStructure },
      { path: "hrga/divisions", Component: Divisions },
      { path: "hrga/sub-divisions", Component: SubDivisions },
      { path: "hrga/kpi", Component: KPI },
      { path: "hrga/master-shift", Component: MasterShift },
      { path: "hrga/recruitment", Component: Recruitment },
      { path: "hrga/warning-letters", Component: WarningLetters },
      { path: "hrga/document-management", Component: DocumentManagement },
      { path: "hrga/security-reports", Component: SecurityReports },
      { path: "hrga/janitor-reports", Component: JanitorReports },
      { path: "hrga/assets", Component: Assets },
      { path: "hrga/asset-repair", Component: AssetRepair },
      { path: "hrga/office-supply-request", Component: OfficeSupplyRequest },

      // Master Routes
      { path: "master/database-schema", Component: DatabaseSchema },
      { path: "master/price-formula-polos", Component: PriceFormulaPolos },
      { path: "master/price-formula-offset", Component: PriceFormulaOffset },
      { path: "master/price-formula-boks", Component: PriceFormulaBoks },
      { path: "master/price-formula-roto", Component: PriceFormulaRoto },
      { path: "master/product-types", Component: ProductTypes },

      // Inventory Master Routes
      { path: "master/jenis-barang", Component: JenisBarangPage },
      { path: "master/kategori-barang", Component: KategoriBarangPage },
      { path: "master/sub-kategori-barang", Component: SubKategoriBarangPage },

      // Procurement Routes
      { path: "procurement/vendor-registration", Component: VendorRegistration },
      { path: "procurement/purchase-orders", Component: PurchaseOrders },
      { path: "procurement/suppliers", Component: Suppliers },
      { path: "procurement/supplier-evaluation", Component: SupplierEvaluation },
      { path: "procurement/purchase-returns", Component: PurchaseReturns },
      { path: "procurement/purchase-payments", Component: PurchasePayments },
      { path: "procurement/supplier-quotations", Component: SupplierQuotations },
    ],
  },
]);