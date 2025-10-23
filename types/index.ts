export interface PatientInfo {
  firstName: string;
  lastName: string;
  mrn: string; // 6-digit unique ID
}

export interface ProviderInfo {
  providerName: string;
  providerNPI: string; // 10-digit number
}

export interface DiagnosisInfo {
  primaryDiagnosis: string; // ICD-10 code
  additionalDiagnoses: string[]; // array of ICD-10 codes
  medicationName: string;
  medicationHistory: string[];
}

export interface PatientRecords {
  patientRecords?: string; // text
  patientFile?: File | null; // optional PDF
}

export interface CarePlanFormData {
  patient: PatientInfo;
  provider: ProviderInfo;
  diagnosis: DiagnosisInfo;
  records: PatientRecords;
}

export interface GeneratedCarePlan {
  id: string;
  patientName: string;
  mrn: string;
  providerName: string;
  medication: string;
  carePlanText: string;
  generatedAt: Date;
}

export interface CarePlanRecord {
  id: string;
  patientName: string;
  mrn: string;
  provider: string;
  medication: string;
  date: string;
}

// Database response types
export interface DuplicateCheckResponse {
  isDuplicate: boolean;
}

export interface CarePlanApiResponse {
  id: string;
  patientName: string;
  mrn: string;
  providerName: string;
  medication: string;
  carePlanText: string;
  generatedAt: string;
}

// Database table types
export interface Provider {
  id: string;
  name: string;
  npi: string;
  created_at: string;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
  provider_id: string | null;
  date_of_birth: string | null;
  sex: string | null;
  weight_kg: number | null;
  allergies: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  patient_id: string;
  medication_name: string;
  primary_diagnosis: string;
  additional_diagnoses: string[];
  medication_history: string[];
  created_at: string;
}

export interface CarePlan {
  id: string;
  order_id: string;
  plan_text: string;
  generated_by: string;
  generated_at: string;
  version: number;
  is_final: boolean;
}

export interface AuditLog {
  id: string;
  event_type: string;
  entity_id: string | null;
  entity_type: string | null;
  description: string | null;
  created_at: string;
}

// Attribution types for source mapping
export interface AttributionSource {
  statement: string;
  sources: string[];
  attribution_type?: 'patient_data' | 'clinical_reasoning' | 'standard_practice' | 'mixed';
}

export interface AttributionSection {
  section: string;
  statements: AttributionSource[];
}

export interface SourceAttribution {
  sections: AttributionSection[];
  generated_at: string;
  model_used: string;
}
