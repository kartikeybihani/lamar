import Link from "next/link";
import {
  ArrowRight,
  FileText,
  BarChart3,
  Shield,
  Clock,
  Users,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Specialty Pharmacy
              <span className="block text-blue-600">Care Plan Generator</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Automate pharmacist care plans in minutes using patient records.
              Generate comprehensive, AI-powered care plans with duplicate
              detection and validation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/new"
                className="btn-primary text-lg px-8 py-3 inline-flex items-center justify-center"
              >
                Start New Care Plan
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/reports"
                className="btn-secondary text-lg px-8 py-3 inline-flex items-center justify-center"
              >
                View Reports
                <BarChart3 className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Streamline Your Care Planning Process
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform helps healthcare professionals create
              comprehensive care plans efficiently and accurately.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Automated Generation
              </h3>
              <p className="text-gray-600">
                Generate comprehensive care plans in minutes using AI-powered
                analysis of patient data.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Duplicate Detection
              </h3>
              <p className="text-gray-600">
                Prevent duplicate entries with real-time validation of patient
                MRNs and provider NPIs.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Time Efficient
              </h3>
              <p className="text-gray-600">
                Reduce care plan creation time from hours to minutes with our
                streamlined workflow.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Provider Integration
              </h3>
              <p className="text-gray-600">
                Seamlessly integrate with existing healthcare workflows and
                provider systems.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analytics & Reports
              </h3>
              <p className="text-gray-600">
                Track care plan effectiveness and generate comprehensive reports
                for quality improvement.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                HIPAA Compliant
              </h3>
              <p className="text-gray-600">
                Built with healthcare security standards in mind, ensuring
                patient data protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-12 rounded-3xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Care Planning?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join healthcare professionals who are already saving time and
              improving patient outcomes.
            </p>
            <Link
              href="/new"
              className="btn-primary text-lg px-8 py-3 inline-flex items-center"
            >
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
