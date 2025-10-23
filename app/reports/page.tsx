"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  Stethoscope,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { CarePlanRecord } from "@/types";
import { getAllCarePlans, exportToCSV } from "@/lib/mockServices";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const [carePlans, setCarePlans] = useState<CarePlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "patient" | "provider">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCarePlans();
  }, []);

  const loadCarePlans = async () => {
    setLoading(true);
    try {
      const data = await getAllCarePlans();
      setCarePlans(data);
    } catch (error) {
      console.error("Error loading care plans:", error);
      toast.error("Failed to load care plans");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      exportToCSV(filteredCarePlans);
      toast.success("Care plans exported successfully");
    } catch (error) {
      console.error("Error exporting care plans:", error);
      toast.error("Failed to export care plans");
    }
  };

  const handleSort = (field: "date" | "patient" | "provider") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredCarePlans = carePlans
    .filter((plan) => {
      const matchesSearch =
        plan.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.mrn.includes(searchTerm) ||
        plan.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.medication.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate = !dateFilter || plan.date === dateFilter;
      const matchesProvider =
        !providerFilter ||
        plan.provider.toLowerCase().includes(providerFilter.toLowerCase());

      return matchesSearch && matchesDate && matchesProvider;
    })
    .sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortBy) {
        case "date":
          aValue = a.date;
          bValue = b.date;
          break;
        case "patient":
          aValue = a.patientName;
          bValue = b.patientName;
          break;
        case "provider":
          aValue = a.provider;
          bValue = b.provider;
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 rounded-2xl shadow-lg mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Care Plan Reports
              </h1>
              <p className="text-gray-600">
                View and manage all generated care plans (
                {filteredCarePlans.length} total)
              </p>
            </div>
            <button
              onClick={handleExport}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-6 rounded-2xl shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Filters & Search
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-ghost flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="form-label">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10"
                  placeholder="Search by patient name, MRN, provider, or medication..."
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Date Filter</label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Provider Filter</label>
                  <input
                    type="text"
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    className="form-input"
                    placeholder="Filter by provider name..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="glass-card rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort("patient")}
                      className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Patient Name
                      {sortBy === "patient" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        ))}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MRN
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort("provider")}
                      className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Provider
                      {sortBy === "provider" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        ))}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medication
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort("date")}
                      className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Date
                      {sortBy === "date" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        ))}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-lg font-medium">
                          Loading care plans...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredCarePlans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">
                          No care plans found
                        </p>
                        <p className="text-sm">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCarePlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {plan.patientName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-mono">
                          {plan.mrn}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Stethoscope className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {plan.provider}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {plan.medication}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatDate(plan.date)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
