"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  User,
  Stethoscope,
  FileText,
  Upload,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";

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
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm({
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

  // Step configuration
  const steps = [
    {
      id: 1,
      title: "Patient Info",
      icon: User,
      description: "Basic patient details",
    },
    {
      id: 2,
      title: "Provider Info",
      icon: Stethoscope,
      description: "Healthcare provider details",
    },
    {
      id: 3,
      title: "Diagnosis & Meds",
      icon: FileText,
      description: "Medical diagnosis and medications",
    },
    {
      id: 4,
      title: "Records",
      icon: Upload,
      description: "Patient records and notes",
    },
  ];

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          watchedValues.patient?.firstName &&
          watchedValues.patient?.lastName &&
          watchedValues.patient?.mrn &&
          !errors.patient
        );
      case 2:
        return (
          watchedValues.provider?.providerName &&
          watchedValues.provider?.providerNPI &&
          !errors.provider
        );
      case 3:
        return (
          watchedValues.diagnosis?.primaryDiagnosis &&
          watchedValues.diagnosis?.medicationName &&
          !errors.diagnosis
        );
      case 4:
        return true; // Records are optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Care Plan
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Follow the steps below to generate a comprehensive care plan. Each
              section builds upon the previous one.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isValid = isStepValid(step.id);

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200",
                        isActive &&
                          "bg-blue-600 border-blue-600 text-white shadow-lg scale-110",
                        isCompleted &&
                          "bg-green-500 border-green-500 text-white",
                        !isActive &&
                          !isCompleted &&
                          "bg-white border-gray-300 text-gray-400",
                        isValid &&
                          !isCompleted &&
                          "border-green-400 bg-green-50 text-green-600"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isActive ? "text-blue-600" : "text-gray-500"
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-4 transition-colors duration-200",
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step 1: Patient Information */}
                {currentStep === 1 && (
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Patient Information
                        </h2>
                        <p className="text-gray-600">
                          Enter the patient's basic details
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          First Name *
                        </label>
                        <input
                          {...register("patient.firstName")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter first name"
                        />
                        {errors.patient?.firstName && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.patient.firstName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Last Name *
                        </label>
                        <input
                          {...register("patient.lastName")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter last name"
                        />
                        {errors.patient?.lastName && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.patient.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Medical Record Number (MRN) *
                      </label>
                      <div className="relative">
                        <input
                          {...register("patient.mrn")}
                          className={cn(
                            "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12",
                            errors.patient?.mrn &&
                              "border-red-300 focus:ring-red-400"
                          )}
                          placeholder="123456"
                          maxLength={6}
                          onBlur={(e) => handleMRNBlur(e.target.value)}
                        />
                        {checkingMRN && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          </div>
                        )}
                      </div>
                      {errors.patient?.mrn && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.patient.mrn.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Must be exactly 6 digits
                      </p>
                    </div>

                    <WarningBanner
                      message="A patient with this MRN already exists in the system. Please verify this is the correct patient."
                      show={showMRNWarning}
                      onDismiss={() => setShowMRNWarning(false)}
                    />
                  </div>
                )}

                {/* Step 2: Provider Information */}
                {currentStep === 2 && (
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Provider Information
                        </h2>
                        <p className="text-gray-600">
                          Enter the healthcare provider's details
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Provider Name *
                        </label>
                        <input
                          {...register("provider.providerName")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Dr. Sarah Johnson"
                        />
                        {errors.provider?.providerName && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.provider.providerName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Provider NPI *
                        </label>
                        <div className="relative">
                          <input
                            {...register("provider.providerNPI")}
                            className={cn(
                              "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12",
                              errors.provider?.providerNPI &&
                                "border-red-300 focus:ring-red-400"
                            )}
                            placeholder="1234567890"
                            maxLength={10}
                            onBlur={(e) => handleNPIBlur(e.target.value)}
                          />
                          {checkingNPI && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                            </div>
                          )}
                        </div>
                        {errors.provider?.providerNPI && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.provider.providerNPI.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Must be exactly 10 digits
                        </p>
                      </div>
                    </div>

                    <WarningBanner
                      message="A provider with this NPI already exists in the system. Please verify this is the correct provider."
                      show={showNPIWarning}
                      onDismiss={() => setShowNPIWarning(false)}
                    />
                  </div>
                )}

                {/* Step 3: Diagnosis & Medications */}
                {currentStep === 3 && (
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Diagnosis & Medications
                        </h2>
                        <p className="text-gray-600">
                          Enter medical diagnosis and medication details
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Primary Diagnosis (ICD-10) *
                        </label>
                        <input
                          {...register("diagnosis.primaryDiagnosis")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="E11.9 - Type 2 diabetes mellitus without complications"
                        />
                        {errors.diagnosis?.primaryDiagnosis && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.diagnosis.primaryDiagnosis.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Additional Diagnoses
                        </label>
                        <div className="space-y-3">
                          {(
                            watchedValues.diagnosis?.additionalDiagnoses || []
                          ).map((diagnosis, index) => (
                            <div key={index} className="flex gap-3">
                              <input
                                value={diagnosis}
                                onChange={(e) =>
                                  updateDiagnosis(index, e.target.value)
                                }
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Additional ICD-10 code"
                              />
                              <button
                                type="button"
                                onClick={() => removeDiagnosis(index)}
                                className="px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addDiagnosis}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium py-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Additional Diagnosis
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Medication Name *
                        </label>
                        <input
                          {...register("diagnosis.medicationName")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Metformin 500mg"
                        />
                        {errors.diagnosis?.medicationName && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.diagnosis.medicationName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Medication History
                        </label>
                        <div className="space-y-3">
                          {(
                            watchedValues.diagnosis?.medicationHistory || []
                          ).map((medication, index) => (
                            <div key={index} className="flex gap-3">
                              <input
                                value={medication}
                                onChange={(e) =>
                                  updateMedicationHistory(index, e.target.value)
                                }
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Previous medication"
                              />
                              <button
                                type="button"
                                onClick={() => removeMedicationHistory(index)}
                                className="px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addMedicationHistory}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium py-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Medication History
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Patient Records */}
                {currentStep === 4 && (
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Upload className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Patient Records
                        </h2>
                        <p className="text-gray-600">
                          Upload records or paste clinical notes
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Clinical Notes
                        </label>
                        <textarea
                          {...register("records.patientRecords")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[120px] resize-y"
                          placeholder="Paste clinical notes, lab results, or other relevant patient information here..."
                        />
                        {errors.records?.patientRecords && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.records.patientRecords.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Upload Patient Record (PDF)
                        </label>
                        <FileUpload
                          onFileSelect={handleFileSelect}
                          acceptedTypes={["application/pdf"]}
                          maxSize={10 * 1024 * 1024} // 10MB
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="bg-gray-50 px-8 py-6 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                      currentStep === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    )}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                    >
                      {showPreview ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      {showPreview ? "Hide Preview" : "Show Preview"}
                    </button>

                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        disabled={!isStepValid(currentStep)}
                        className={cn(
                          "flex items-center gap-2 px-6 py-2 rounded-lg transition-all",
                          isStepValid(currentStep)
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        )}
                      >
                        Next
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!canSubmit}
                        className={cn(
                          "flex items-center gap-2 px-6 py-2 rounded-lg transition-all",
                          canSubmit
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            Generate Care Plan
                            <CheckCircle className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {showPreview && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Form Preview
                  </h3>

                  <div className="space-y-4">
                    {/* Patient Info Preview */}
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-gray-900">
                        Patient Information
                      </h4>
                      <div className="text-sm text-gray-600 mt-1">
                        {watchedValues.patient?.firstName &&
                        watchedValues.patient?.lastName ? (
                          <p>
                            {watchedValues.patient.firstName}{" "}
                            {watchedValues.patient.lastName}
                          </p>
                        ) : (
                          <p className="text-gray-400">Not filled</p>
                        )}
                        {watchedValues.patient?.mrn && (
                          <p>MRN: {watchedValues.patient.mrn}</p>
                        )}
                      </div>
                    </div>

                    {/* Provider Info Preview */}
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium text-gray-900">
                        Provider Information
                      </h4>
                      <div className="text-sm text-gray-600 mt-1">
                        {watchedValues.provider?.providerName ? (
                          <p>{watchedValues.provider.providerName}</p>
                        ) : (
                          <p className="text-gray-400">Not filled</p>
                        )}
                        {watchedValues.provider?.providerNPI && (
                          <p>NPI: {watchedValues.provider.providerNPI}</p>
                        )}
                      </div>
                    </div>

                    {/* Diagnosis Preview */}
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-medium text-gray-900">
                        Diagnosis & Medications
                      </h4>
                      <div className="text-sm text-gray-600 mt-1">
                        {watchedValues.diagnosis?.primaryDiagnosis ? (
                          <p>
                            Primary: {watchedValues.diagnosis.primaryDiagnosis}
                          </p>
                        ) : (
                          <p className="text-gray-400">Not filled</p>
                        )}
                        {watchedValues.diagnosis?.medicationName && (
                          <p>
                            Medication: {watchedValues.diagnosis.medicationName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Records Preview */}
                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-medium text-gray-900">
                        Patient Records
                      </h4>
                      <div className="text-sm text-gray-600 mt-1">
                        {watchedValues.records?.patientRecords ? (
                          <p className="text-green-600">
                            Clinical notes provided
                          </p>
                        ) : (
                          <p className="text-gray-400">No clinical notes</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Summary */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Form Completion</span>
                      <span className="font-medium text-gray-900">
                        {Math.round(
                          (Object.keys(watchedValues).filter(
                            (key) =>
                              watchedValues[
                                key as keyof typeof watchedValues
                              ] &&
                              Object.keys(
                                watchedValues[
                                  key as keyof typeof watchedValues
                                ] || {}
                              ).length > 0
                          ).length /
                            4) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (Object.keys(watchedValues).filter(
                              (key) =>
                                watchedValues[
                                  key as keyof typeof watchedValues
                                ] &&
                                Object.keys(
                                  watchedValues[
                                    key as keyof typeof watchedValues
                                  ] || {}
                                ).length > 0
                            ).length /
                              4) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step Navigation */}
              <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Navigation
                </h3>
                <div className="space-y-2">
                  {steps.map((step) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    const isValid = isStepValid(step.id);

                    return (
                      <button
                        key={step.id}
                        onClick={() => setCurrentStep(step.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                          isActive && "bg-blue-50 border border-blue-200",
                          isCompleted && "bg-green-50 border border-green-200",
                          !isActive && !isCompleted && "hover:bg-gray-50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                            isActive && "bg-blue-600 text-white",
                            isCompleted && "bg-green-500 text-white",
                            !isActive &&
                              !isCompleted &&
                              "bg-gray-200 text-gray-500"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={cn(
                              "font-medium text-sm",
                              isActive ? "text-blue-900" : "text-gray-700"
                            )}
                          >
                            {step.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {step.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
