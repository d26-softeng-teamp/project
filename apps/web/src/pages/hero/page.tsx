import { FileText, LayoutGrid, Users } from "lucide-react";
import { Link } from "react-router";

function HeroPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Split Layout */}
      <section className="flex flex-col lg:flex-row">
        {/* Left side - White background with content */}
        <div className="flex-1 bg-white px-8 lg:px-16 py-16 lg:py-24">
          <h1 className="text-4xl sm:text-5xl font-bold text-hanover-deepblue mb-4">
            Welcome to Hanover
          </h1>
          <p className="text-gray-600 text-lg mb-8">Your internal knowledge management portal</p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Link
              to="/content"
              className="flex flex-col items-center justify-center gap-3 w-40 h-28 bg-hanover-green hover:bg-hanover-green/90 text-white rounded-lg transition-colors"
            >
              <FileText className="w-8 h-8" />
              <span className="text-sm font-medium">Manage Content</span>
            </Link>
            <Link
              to="/employees"
              className="flex flex-col items-center justify-center gap-3 w-40 h-28 bg-hanover-green hover:bg-hanover-green/90 text-white rounded-lg transition-colors"
            >
              <Users className="w-8 h-8" />
              <span className="text-sm font-medium">Manage Employees</span>
            </Link>
            <Link
              to="/dashboard"
              className="flex flex-col items-center justify-center gap-3 w-40 h-28 bg-hanover-green hover:bg-hanover-green/90 text-white rounded-lg transition-colors"
            >
              <LayoutGrid className="w-8 h-8" />
              <span className="text-sm font-medium">View Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Right side - Navy background with branding */}
        <div className="lg:w-100 bg-hanover-deepblue flex items-center justify-center py-16 lg:py-24 px-8">
          <div className="text-center">
            <p className="text-gray-400 text-2xl font-light">The Hanover</p>
            <p className="text-gray-400 text-2xl font-light">Insurance Group</p>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-12 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* My Frequently Used Links */}
            <div className="bg-white border-l-4 border-l-hanover-green p-6">
              <h3 className="text-lg font-bold text-hanover-deepblue mb-4">
                My Frequently Used Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <span className="cursor-pointer text-hanover-green hover:underline">
                    Underwriting Guidelines Portal
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer text-hanover-green hover:underline">
                    Claims Status Dashboard
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer text-hanover-green hover:underline">
                    Policy Document Repository
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer text-hanover-green hover:underline">
                    Training Resources Hub
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer text-hanover-green hover:underline">
                    IT Support Ticketing System
                  </span>
                </li>
              </ul>
            </div>

            {/* Role's Frequently Used Links */}
            <div className="bg-white border-l-4 border-l-hanover-green p-6">
              <h3 className="text-lg font-bold text-hanover-deepblue mb-4">
                {"My Role's Frequently Used Links"}
              </h3>
              <ul className="space-y-3">
                <li>
                  <span className="cursor-pointer text-hanover-green hover:underline">
                    Commercial Lines Rating Tool
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer text-hanover-green hover:underline">
                    Risk Assessment Calculator
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer text-hanover-green hover:underline">
                    Agent Performance Reports
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer text-hanover-green hover:underline">
                    Compliance Checklist
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer text-hanover-green hover:underline">
                    Product Knowledge Base
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HeroPage;
