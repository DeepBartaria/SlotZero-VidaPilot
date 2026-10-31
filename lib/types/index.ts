/**
 * AssetFlow domain types - the client-facing shape of every entity.
 * Field names follow plans/DATABASE.md; populated ref shapes follow the DTO
 * examples in plans/API.md. These REPLACE the interfaces previously inlined
 * in the page components.
 */

import type {
  Role,
  UserStatus,
  AssetStatus,
  Condition,
  AllocationStatus,
  TransferStatus,
  BookingStatus,
  MaintenanceStatus,
  Priority,
  AuditCycleStatus,
  AuditScopeType,
  Verification,
  EntityType,
  NotificationType,
  CustomFieldType,
} from './enums';

export * from './enums';

/* ---- Primitives --------------------------------------------------------- */

/** ISO-8601 UTC string as returned by the API. */
export type ISODateString = string;

/** A populated reference the API returns inline (e.g. currentHolder). */
export interface UserRef {
  id: string;
  name: string;
  email?: string;
  role?: Role;
}

export interface DepartmentRef {
  id: string;
  name: string;
}

export interface CategoryRef {
  id: string;
  name: string;
}

/** Some endpoints return just the id string, others a populated object. */
export type Ref<T> = string | T;

/* ---- Users & org -------------------------------------------------------- */

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: DepartmentRef | null;
  status: UserStatus;
  lastLoginAt?: ISODateString | null;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface Department {
  id: string;
  name: string;
  head?: UserRef | null;
  parentDepartment?: DepartmentRef | null;
  status: UserStatus;
  description?: string;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface CustomFieldDef {
  key: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  customFields: CustomFieldDef[];
  status: UserStatus;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

/* ---- Assets ------------------------------------------------------------- */

export type HealthBand = 'healthy' | 'watch' | 'at-risk';

export interface AssetDocumentRef {
  name: string;
  url: string;
}

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category?: CategoryRef | null;
  serialNumber?: string;
  acquisitionDate?: ISODateString | null;
  acquisitionCost?: number;
  condition: Condition;
  location?: string;
  photos?: string[];
  documents?: AssetDocumentRef[];
  isBookable: boolean;
  status: AssetStatus;
  currentHolder?: UserRef | null;
  currentDepartment?: DepartmentRef | null;
  customFieldValues?: Record<string, unknown>;
  lastMaintenanceAt?: ISODateString | null;
  maintenanceCount?: number;
  retiredAt?: ISODateString | null;
  /** Computed on read (see lib/utils/healthScore.ts). */
  healthScore?: number;
  healthBand?: HealthBand;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

/* ---- Allocation / Transfer --------------------------------------------- */

export interface Allocation {
  id: string;
  asset: Ref<Asset>;
  allocatedTo?: UserRef | null;
  department?: DepartmentRef | null;
  allocatedBy: UserRef;
  allocationDate: ISODateString;
  expectedReturnDate?: ISODateString | null;
  actualReturnDate?: ISODateString | null;
  returnCondition?: Condition | null;
  returnNotes?: string;
  status: AllocationStatus;
  createdAt?: ISODateString;
}

export interface Transfer {
  id: string;
  asset: Ref<Asset>;
  fromUser?: UserRef | null;
  toUser: UserRef;
  toDepartment?: DepartmentRef | null;
  requestedBy: UserRef;
  reason?: string;
  status: TransferStatus;
  approvedBy?: UserRef | null;
  decidedAt?: ISODateString | null;
  createdAt?: ISODateString;
}

/* ---- Booking ------------------------------------------------------------ */

export interface Booking {
  id: string;
  resource: Ref<Asset>;
  bookedBy: UserRef;
  department?: DepartmentRef | null;
  startTime: ISODateString;
  endTime: ISODateString;
  purpose?: string;
  status: BookingStatus;
  cancelledReason?: string;
  createdAt?: ISODateString;
}

/* ---- Maintenance -------------------------------------------------------- */

export interface MaintenanceRequest {
  id: string;
  asset: Ref<Asset>;
  raisedBy: UserRef;
  issueDescription: string;
  priority: Priority;
  photos?: string[];
  status: MaintenanceStatus;
  approvedBy?: UserRef | null;
  technician?: string;
  resolutionNotes?: string;
  approvedAt?: ISODateString | null;
  resolvedAt?: ISODateString | null;
  createdAt?: ISODateString;
}

/* ---- Audit -------------------------------------------------------------- */

export interface AuditCycle {
  id: string;
  name: string;
  scopeType: AuditScopeType;
  scopeValue: string;
  startDate: ISODateString;
  endDate: ISODateString;
  auditors: UserRef[];
  status: AuditCycleStatus;
  createdBy: UserRef;
  closedAt?: ISODateString | null;
  discrepancyCount: number;
  createdAt?: ISODateString;
}

export interface AuditItem {
  id: string;
  auditCycle: Ref<AuditCycle>;
  asset: Ref<Asset>;
  expectedLocation?: string;
  verification: Verification;
  auditedBy?: UserRef | null;
  auditedAt?: ISODateString | null;
  notes?: string;
}

/* ---- Notifications & activity ------------------------------------------ */

export interface Notification {
  id: string;
  recipient: Ref<User>;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: EntityType | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: ISODateString;
}

export interface ActivityLog {
  id: string;
  actor: UserRef;
  action: string;
  entityType: EntityType;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: ISODateString;
}

/* ---- Dashboard ---------------------------------------------------------- */

export interface DashboardKpis {
  available: number;
  allocated: number;
  maintenanceToday: number;
  activeBookings: number;
  pendingTransfers: number;
  upcomingReturns: number;
}

export interface OverdueItem {
  assetTag: string;
  dueDaysAgo: number;
  holder: string;
}

export interface DashboardData {
  kpis: DashboardKpis;
  overdue: { count: number; items: OverdueItem[] };
  recentActivity: Array<{ action: string; description: string; at: ISODateString }>;
}

/* ---- API envelope (plans/API.md sec 1) --------------------------------- */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiFieldError {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  /** zod field errors OR a structured conflict payload. */
  details?: ApiFieldError[] | Record<string, unknown>;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiFailure {
  ok: false;
  error: ApiErrorBody;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

/** A paginated list result surfaced to the UI. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
