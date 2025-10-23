import { CarePlanFormData, GeneratedCarePlan, CarePlanRecord } from '@/types';

// Mock data for duplicate checking
const existingMRNs = ['123456', '789012', '345678'];
const existingNPIs = ['1234567890', '0987654321', '1122334455'];

// Mock care plan records
const mockCarePlans: CarePlanRecord[] = [
  {
    id: '1',
    patientName: 'John Smith',
    mrn: '123456',
    provider: 'Dr. Sarah Johnson',
    medication: 'Metformin 500mg',
    date: '2024-01-15'
  },
  {
    id: '2',
    patientName: 'Jane Doe',
    mrn: '789012',
    provider: 'Dr. Michael Chen',
    medication: 'Lisinopril 10mg',
    date: '2024-01-14'
  },
  {
    id: '3',
    patientName: 'Robert Wilson',
    mrn: '345678',
    provider: 'Dr. Emily Davis',
    medication: 'Atorvastatin 20mg',
    date: '2024-01-13'
  }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if patient MRN already exists
export const checkDuplicatePatient = async (mrn: string): Promise<boolean> => {
  await delay(500); // Simulate API call
  return existingMRNs.includes(mrn);
};

// Check if provider NPI already exists
export const checkDuplicateProvider = async (npi: string): Promise<boolean> => {
  await delay(500); // Simulate API call
  return existingNPIs.includes(npi);
};

// Generate care plan using AI (mock)
export const generateCarePlan = async (formData: CarePlanFormData): Promise<GeneratedCarePlan> => {
  await delay(2000); // Simulate AI processing time
  
  const carePlanText = `
CARE PLAN FOR ${formData.patient.firstName.toUpperCase()} ${formData.patient.lastName.toUpperCase()}
Medical Record Number: ${formData.patient.mrn}
Provider: ${formData.provider.providerName} (NPI: ${formData.provider.providerNPI})
Date Generated: ${new Date().toLocaleDateString()}

PRIMARY DIAGNOSIS: ${formData.diagnosis.primaryDiagnosis}
${formData.diagnosis.additionalDiagnoses.length > 0 ? 
  `ADDITIONAL DIAGNOSES: ${formData.diagnosis.additionalDiagnoses.join(', ')}` : ''}

MEDICATION: ${formData.diagnosis.medicationName}
${formData.diagnosis.medicationHistory.length > 0 ? 
  `MEDICATION HISTORY: ${formData.diagnosis.medicationHistory.join(', ')}` : ''}

CARE PLAN RECOMMENDATIONS:

1. MEDICATION MANAGEMENT
   - Monitor patient adherence to ${formData.diagnosis.medicationName}
   - Assess for drug interactions and side effects
   - Adjust dosage as needed based on patient response

2. PATIENT EDUCATION
   - Provide comprehensive medication counseling
   - Review proper administration techniques
   - Discuss potential side effects and when to contact provider

3. MONITORING PARAMETERS
   - Regular follow-up appointments every 3 months
   - Laboratory monitoring as indicated
   - Assessment of therapeutic response

4. LIFESTYLE MODIFICATIONS
   - Dietary counseling as appropriate
   - Exercise recommendations
   - Smoking cessation if applicable

5. CARE COORDINATION
   - Coordinate with primary care provider
   - Ensure appropriate referrals as needed
   - Maintain communication with patient's care team

FOLLOW-UP PLAN:
- Next appointment scheduled for 3 months
- Patient to contact pharmacy with any questions
- Provider to review care plan effectiveness

This care plan was generated using AI-assisted clinical decision support and should be reviewed by the healthcare provider before implementation.
  `.trim();

  return {
    id: `cp_${Date.now()}`,
    patientName: `${formData.patient.firstName} ${formData.patient.lastName}`,
    mrn: formData.patient.mrn,
    providerName: formData.provider.providerName,
    medication: formData.diagnosis.medicationName,
    carePlanText,
    generatedAt: new Date()
  };
};

// Get all care plans for reports
export const getAllCarePlans = async (): Promise<CarePlanRecord[]> => {
  await delay(300); // Simulate API call
  return mockCarePlans;
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

// Save care plan to database (mock)
export const saveCarePlan = async (carePlan: GeneratedCarePlan): Promise<boolean> => {
  await delay(1000); // Simulate database save
  console.log('Care plan saved to database:', carePlan);
  return true;
};
