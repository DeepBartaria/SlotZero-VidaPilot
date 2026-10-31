/**
 * AssetFlow shared enums - single source of truth for the frontend.
 * Mirrors plans/DATABASE.md sec 2. Keep values in sync with the backend
 * zod enums in lib/validation/enums.ts (owned by F1).
 */

export const ROLES = ['admin', 'asset_manager', 'department_head', 'employee'] as const;
export type Role = (typeof ROLES)[number];

export const ASSET_STATUS = [
  'available',
  'allocated',
  'reserved',
  'under_maintenance',
  'lost',
  'retired',
  'disposed',
] as const;
export type AssetStatus = (typeof ASSET_STATUS)[number];

export const CONDITION = ['excellent', 'good', 'fair', 'poor'] as const;
export type Condition = (typeof CONDITION)[number];

export const ALLOCATION_STATUS = ['active', 'returned', 'overdue'] as const;
export type AllocationStatus = (typeof ALLOCATION_STATUS)[number];

export const TRANSFER_STATUS = ['requested', 'approved', 'rejected', 'completed'] as const;
export type TransferStatus = (typeof TRANSFER_STATUS)[number];

export const BOOKING_STATUS = ['upcoming', 'ongoing', 'completed', 'cancelled'] as const;
export type BookingStatus = (typeof BOOKING_STATUS)[number];

export const MAINT_STATUS = [
  'pending',
  'approved',
  'rejected',
  'technician_assigned',
  'in_progress',
  'resolved',
] as const;
export type MaintenanceStatus = (typeof MAINT_STATUS)[number];

export const PRIORITY = ['low', 'medium', 'high', 'critical'] as const;
export type Priority = (typeof PRIORITY)[number];

export const AUDIT_CYCLE_STATUS = ['active', 'closed'] as const;
export type AuditCycleStatus = (typeof AUDIT_CYCLE_STATUS)[number];

export const VERIFICATION = ['pending', 'verified', 'missing', 'damaged'] as const;
export type Verification = (typeof VERIFICATION)[number];

export const ENTITY_TYPES = [
  'asset',
  'allocation',
  'transfer',
  'booking',
  'maintenance',
  'audit',
  'user',
  'department',
  'category',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const NOTIF_TYPES = [
  'asset_assigned',
  'maintenance_approved',
  'maintenance_rejected',
  'booking_confirmed',
  'booking_cancelled',
  'booking_reminder',
  'transfer_requested',
  'transfer_approved',
  'transfer_rejected',
  'overdue_return',
  'audit_discrepancy',
] as const;
export type NotificationType = (typeof NOTIF_TYPES)[number];

export const CUSTOM_FIELD_TYPES = ['text', 'number', 'date', 'boolean'] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export const USER_STATUS = ['active', 'inactive'] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const AUDIT_SCOPE_TYPE = ['department', 'location'] as const;
export type AuditScopeType = (typeof AUDIT_SCOPE_TYPE)[number];
