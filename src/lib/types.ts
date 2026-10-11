export type Gender = "female" | "male" | "other" | "undisclosed";
export type VisitType = "routine" | "follow-up" | "emergency" | "postnatal" | "ANC";
export type CountyName = "Turkana" | "Kisii" | "Kajiado" | "Kilifi" | "Tana River";
export type HealthRecordKind = "patient" | "visit" | "immunisation";
export type QueueKind = HealthRecordKind | "partnership" | "newsletter" | "contact" | "problem";

export interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  village: string;
  householdNumber: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  chronicConditions: string[];
  county: CountyName;
  subCounty?: string;
  ward?: string;
  followUpDue?: string;
  createdAt: string;
  updatedAt: string;
  sample?: boolean;
}

export interface Visit {
  id: string;
  patientId: string;
  visitedAt: string;
  visitType: VisitType;
  temperature?: number;
  weightKg?: number;
  bloodPressure?: string;
  chiefComplaint: string;
  interventions: string;
  referral: boolean;
  referralFacility?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  sample?: boolean;
}

export interface ImmunisationRecord {
  id: string;
  patientId: string;
  vaccine: string;
  dose: string;
  dateGiven?: string;
  dueDate: string;
  status: "given" | "due" | "overdue";
  createdAt: string;
  sample?: boolean;
}

export interface PendingRecord {
  id: string;
  kind: QueueKind;
  operation: "upsert" | "delete" | "submit";
  createdAt: string;
  payload: unknown;
  endpoint?: string;
}

export interface SyncLogEntry {
  id: string;
  createdAt: string;
  status: "success" | "failed" | "info";
  message: string;
  count?: number;
}

export interface ChwProfile {
  fullName: string;
  chwId: string;
  county: CountyName;
  subCounty: string;
  ward: string;
  email?: string;
  phone?: string;
  demo?: boolean;
}

export interface ApiError {
  error: string;
  message?: string;
  fallback?: "v2";
}
