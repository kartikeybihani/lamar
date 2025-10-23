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
  patientRecords: string; // text
  patientFile: File | null; // optional PDF
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
