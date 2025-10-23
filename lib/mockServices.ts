import { CarePlanFormData, GeneratedCarePlan, CarePlanRecord, DuplicateCheckResponse, CarePlanApiResponse } from '@/types';

// Check if patient MRN already exists
export const checkDuplicatePatient = async (mrn: string): Promise<boolean> => {
  const response = await fetch(`/api/duplicates/patient?mrn=${mrn}`);
  if (!response.ok) {
    throw new Error('Failed to check patient duplicate');
  }
  const data: DuplicateCheckResponse = await response.json();
  return data.isDuplicate;
};

// Check if provider NPI already exists
export const checkDuplicateProvider = async (npi: string): Promise<boolean> => {
  const response = await fetch(`/api/duplicates/provider?npi=${npi}`);
  if (!response.ok) {
    throw new Error('Failed to check provider duplicate');
  }
  const data: DuplicateCheckResponse = await response.json();
  return data.isDuplicate;
};

// Check if order already exists (same patient + medication + diagnosis)
export const checkDuplicateOrder = async (
  mrn: string,
  medicationName: string,
  primaryDiagnosis: string
): Promise<boolean> => {
  const response = await fetch(
    `/api/duplicates/order?mrn=${mrn}&medicationName=${encodeURIComponent(medicationName)}&primaryDiagnosis=${encodeURIComponent(primaryDiagnosis)}`
  );
  if (!response.ok) {
    throw new Error('Failed to check order duplicate');
  }
  const data: DuplicateCheckResponse = await response.json();
  return data.isDuplicate;
};

// Generate care plan using API
export const generateCarePlan = async (formData: CarePlanFormData): Promise<GeneratedCarePlan> => {
  const response = await fetch('/api/care-plans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate care plan');
  }

  const data: CarePlanApiResponse = await response.json();
  
  return {
    id: data.id,
    patientName: data.patientName,
    mrn: data.mrn,
    providerName: data.providerName,
    medication: data.medication,
    carePlanText: data.carePlanText,
    generatedAt: new Date(data.generatedAt)
  };
};

// Get all care plans for reports
export const getAllCarePlans = async (): Promise<CarePlanRecord[]> => {
  const response = await fetch('/api/reports');
  if (!response.ok) {
    throw new Error('Failed to fetch care plans');
  }
  return await response.json();
};

// Export care plans to CSV
export const exportToCSV = (data: CarePlanRecord[]): void => {
  const csvContent = [
    'Patient Name,MRN,Provider,Medication,Date',
    ...data.map(record => 
      `"${record.patientName}","${record.mrn}","${record.provider}","${record.medication}","${record.date}"`
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `care-plans-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Save care plan to database (now handled automatically in generateCarePlan)
export const saveCarePlan = async (carePlan: GeneratedCarePlan): Promise<boolean> => {
  // Care plan is automatically saved during generation
  console.log('Care plan already saved to database:', carePlan);
  return true;
};
