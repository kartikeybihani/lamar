import { z } from 'zod';

// Patient validation schema
export const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  mrn: z.string()
    .min(6, 'MRN must be exactly 6 digits')
    .max(6, 'MRN must be exactly 6 digits')
    .regex(/^\d{6}$/, 'MRN must contain only numbers'),
});

// Provider validation schema
export const providerSchema = z.object({
  providerName: z.string().min(1, 'Provider name is required'),
  providerNPI: z.string()
    .min(10, 'NPI must be exactly 10 digits')
    .max(10, 'NPI must be exactly 10 digits')
    .regex(/^\d{10}$/, 'NPI must contain only numbers'),
});

// Diagnosis validation schema
export const diagnosisSchema = z.object({
  primaryDiagnosis: z.string().min(1, 'Primary diagnosis is required'),
  additionalDiagnoses: z.array(z.string()).default([]),
  medicationName: z.string().min(1, 'Medication name is required'),
  medicationHistory: z.array(z.string()).default([]),
});

// Patient records validation schema
export const recordsSchema = z.object({
  patientRecords: z.string().optional(),
  patientFile: z.instanceof(File).nullable().optional(),
});

// Complete care plan form schema
export const carePlanFormSchema = z.object({
  patient: patientSchema,
  provider: providerSchema,
  diagnosis: diagnosisSchema,
  records: recordsSchema,
});

export type PatientFormData = z.infer<typeof patientSchema>;
export type ProviderFormData = z.infer<typeof providerSchema>;
export type DiagnosisFormData = z.infer<typeof diagnosisSchema>;
export type RecordsFormData = z.infer<typeof recordsSchema>;
export type CarePlanFormData = z.infer<typeof carePlanFormSchema>;
