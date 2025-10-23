"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X, AlertCircle } from "lucide-react";

import { carePlanFormSchema, type CarePlanFormData } from "@/lib/validations";
import {
  checkDuplicatePatient,
  checkDuplicateProvider,
  generateCarePlan,
} from "@/lib/mockServices";
import { cn } from "@/lib/utils";
import FormSection from "../components/FormSection";
import WarningBanner from "../components/WarningBanner";
import FileUpload from "../components/FileUpload";

export default function NewCarePlanPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMRNWarning, setShowMRNWarning] = useState(false);
  const [showNPIWarning, setShowNPIWarning] = useState(false);
  const [checkingMRN, setCheckingMRN] = useState(false);
  const [checkingNPI, setCheckingNPI] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<CarePlanFormData>({
    resolver: zodResolver(carePlanFormSchema),
    mode: "onChange",
  });

  const watchedValues = watch();

  // Handle MRN duplicate check
  const handleMRNBlur = async (mrn: string) => {
    if (mrn.length !== 6) return;

    setCheckingMRN(true);
    try {
      const isDuplicate = await checkDuplicatePatient(mrn);
      if (isDuplicate) {
        setShowMRNWarning(true);
        setError("patient.mrn", {
          message: "Patient with this MRN already exists",
        });
      } else {
        setShowMRNWarning(false);
        clearErrors("patient.mrn");
      }
    } catch (error) {
      console.error("Error checking MRN:", error);
    } finally {
      setCheckingMRN(false);
    }
  };

  // Handle NPI duplicate check
  const handleNPIBlur = async (npi: string) => {
    if (npi.length !== 10) return;

    setCheckingNPI(true);
    try {
      const isDuplicate = await checkDuplicateProvider(npi);
      if (isDuplicate) {
        setShowNPIWarning(true);
        setError("provider.providerNPI", {
          message: "Provider with this NPI already exists",
        });
      } else {
        setShowNPIWarning(false);
        clearErrors("provider.providerNPI");
      }
    } catch (error) {
      console.error("Error checking NPI:", error);
    } finally {
      setCheckingNPI(false);
    }
  };

  // Handle additional diagnoses
  const addDiagnosis = () => {
    const current = watchedValues.diagnosis?.additionalDiagnoses || [];
    setValue("diagnosis.additionalDiagnoses", [...current, ""]);
  };

  const removeDiagnosis = (index: number) => {
    const current = watchedValues.diagnosis?.additionalDiagnoses || [];
    setValue(
      "diagnosis.additionalDiagnoses",
      current.filter((_, i) => i !== index)
    );
  };

  const updateDiagnosis = (index: number, value: string) => {
    const current = watchedValues.diagnosis?.additionalDiagnoses || [];
    const updated = [...current];
    updated[index] = value;
    setValue("diagnosis.additionalDiagnoses", updated);
  };

  // Handle medication history
  const addMedicationHistory = () => {
    const current = watchedValues.diagnosis?.medicationHistory || [];
    setValue("diagnosis.medicationHistory", [...current, ""]);
  };

  const removeMedicationHistory = (index: number) => {
    const current = watchedValues.diagnosis?.medicationHistory || [];
    setValue(
      "diagnosis.medicationHistory",
      current.filter((_, i) => i !== index)
    );
  };

  const updateMedicationHistory = (index: number, value: string) => {
    const current = watchedValues.diagnosis?.medicationHistory || [];
    const updated = [...current];
    updated[index] = value;
    setValue("diagnosis.medicationHistory", updated);
  };

  // Handle file upload
  const handleFileSelect = (file: File | null) => {
    setValue("records.patientFile", file);
  };

  // Handle form submission
  const onSubmit = async (data: CarePlanFormData) => {
    if (showMRNWarning || showNPIWarning) {
      toast.error("Please resolve duplicate warnings before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const carePlan = await generateCarePlan(data);

      // Store in sessionStorage for result page
      sessionStorage.setItem("generatedCarePlan", JSON.stringify(carePlan));

      toast.success("Care plan generated successfully!");
      router.push("/result");
    } catch (error) {
      console.error("Error generating care plan:", error);
      toast.error("Failed to generate care plan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    isValid && !showMRNWarning && !showNPIWarning && !isSubmitting;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="glass-card p-6 rounded-2xl shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Care Plan
            </h1>
            <p className="text-gray-600">
              Enter patient information to generate a comprehensive care plan
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Patient Information */}
            <FormSection
              title="Patient Information"
              description="Enter the patient's basic information"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">First Name *</label>
                  <input
                    {...register("patient.firstName")}
                    className="form-input"
                    placeholder="Enter first name"
                  />
                  {errors.patient?.firstName && (
                    <p className="form-error">
                      {errors.patient.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">Last Name *</label>
                  <input
                    {...register("patient.lastName")}
                    className="form-input"
                    placeholder="Enter last name"
                  />
                  {errors.patient?.lastName && (
                    <p className="form-error">
                      {errors.patient.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label">
                  Medical Record Number (MRN) *
                </label>
                <div className="relative">
                  <input
                    {...register("patient.mrn")}
                    className={cn(
                      "form-input pr-10",
                      errors.patient?.mrn && "border-red-300 focus:ring-red-400"
                    )}
                    placeholder="123456"
                    maxLength={6}
                    onBlur={(e) => handleMRNBlur(e.target.value)}
                  />
                  {checkingMRN && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
                {errors.patient?.mrn && (
                  <p className="form-error">{errors.patient.mrn.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Must be exactly 6 digits
                </p>
              </div>

              <WarningBanner
                message="A patient with this MRN already exists in the system. Please verify this is the correct patient."
                show={showMRNWarning}
                onDismiss={() => setShowMRNWarning(false)}
              />
            </FormSection>

            {/* Provider Information */}
            <FormSection
              title="Provider Information"
              description="Enter the healthcare provider's information"
            >
              <div>
                <label className="form-label">Provider Name *</label>
                <input
                  {...register("provider.providerName")}
                  className="form-input"
                  placeholder="Dr. Sarah Johnson"
                />
                {errors.provider?.providerName && (
                  <p className="form-error">
                    {errors.provider.providerName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Provider NPI *</label>
                <div className="relative">
                  <input
                    {...register("provider.providerNPI")}
                    className={cn(
                      "form-input pr-10",
                      errors.provider?.providerNPI &&
                        "border-red-300 focus:ring-red-400"
                    )}
                    placeholder="1234567890"
                    maxLength={10}
                    onBlur={(e) => handleNPIBlur(e.target.value)}
                  />
                  {checkingNPI && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
                {errors.provider?.providerNPI && (
                  <p className="form-error">
                    {errors.provider.providerNPI.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Must be exactly 10 digits
                </p>
              </div>

              <WarningBanner
                message="A provider with this NPI already exists in the system. Please verify this is the correct provider."
                show={showNPIWarning}
                onDismiss={() => setShowNPIWarning(false)}
              />
            </FormSection>

            {/* Diagnosis & Medications */}
            <FormSection
              title="Diagnosis & Medications"
              description="Enter diagnosis information and medication details"
            >
              <div>
                <label className="form-label">
                  Primary Diagnosis (ICD-10) *
                </label>
                <input
                  {...register("diagnosis.primaryDiagnosis")}
                  className="form-input"
                  placeholder="E11.9 - Type 2 diabetes mellitus without complications"
                />
                {errors.diagnosis?.primaryDiagnosis && (
                  <p className="form-error">
                    {errors.diagnosis.primaryDiagnosis.message}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Additional Diagnoses</label>
                <div className="space-y-2">
                  {(watchedValues.diagnosis?.additionalDiagnoses || []).map(
                    (diagnosis, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          value={diagnosis}
                          onChange={(e) =>
                            updateDiagnosis(index, e.target.value)
                          }
                          className="form-input flex-1"
                          placeholder="Additional ICD-10 code"
                        />
                        <button
                          type="button"
                          onClick={() => removeDiagnosis(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  )}
                  <button
                    type="button"
                    onClick={addDiagnosis}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Additional Diagnosis
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Medication Name *</label>
                <input
                  {...register("diagnosis.medicationName")}
                  className="form-input"
                  placeholder="Metformin 500mg"
                />
                {errors.diagnosis?.medicationName && (
                  <p className="form-error">
                    {errors.diagnosis.medicationName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Medication History</label>
                <div className="space-y-2">
                  {(watchedValues.diagnosis?.medicationHistory || []).map(
                    (medication, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          value={medication}
                          onChange={(e) =>
                            updateMedicationHistory(index, e.target.value)
                          }
                          className="form-input flex-1"
                          placeholder="Previous medication"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedicationHistory(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  )}
                  <button
                    type="button"
                    onClick={addMedicationHistory}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Medication History
                  </button>
                </div>
              </div>
            </FormSection>

            {/* Patient Records */}
            <FormSection
              title="Patient Records"
              description="Upload patient records or paste clinical notes"
            >
              <div>
                <label className="form-label">Clinical Notes</label>
                <textarea
                  {...register("records.patientRecords")}
                  className="form-input min-h-[120px] resize-y"
                  placeholder="Paste clinical notes, lab results, or other relevant patient information here..."
                />
                {errors.records?.patientRecords && (
                  <p className="form-error">
                    {errors.records.patientRecords.message}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">
                  Upload Patient Record (PDF)
                </label>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  acceptedTypes={["application/pdf"]}
                  maxSize={10 * 1024 * 1024} // 10MB
                />
              </div>
            </FormSection>

            {/* Generate Care Plan */}
            <FormSection
              title="Generate Care Plan"
              description="Review your information and generate the care plan"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">
                      Ready to generate your care plan?
                    </p>
                    <p>
                      Please review all information above. The AI will analyze
                      the patient data and generate a comprehensive care plan
                      based on the provided information.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className={cn(
                  "w-full btn-primary text-lg py-3 flex items-center justify-center gap-2",
                  !canSubmit && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Care Plan...
                  </>
                ) : (
                  "Generate Care Plan"
                )}
              </button>

              {!canSubmit && (
                <p className="text-sm text-gray-500 text-center">
                  Please complete all required fields and resolve any warnings
                </p>
              )}
            </FormSection>
          </form>
        </div>
      </div>
    </div>
  );
}
