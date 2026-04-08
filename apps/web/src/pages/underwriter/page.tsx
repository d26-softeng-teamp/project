const underwriterLinks = [
  "Desktop Management Tool",
  "States on Hold",
  "RiskMeter Online",
  "ISOnet Website",
  "Forms Knowledge Base",
  "Experience & Schedule Rating Plans",
  "Property View",
  "Coastal Guidelines",
  "IPS (Image & Processing System)",
  "Underwriting Workstation",
];

function UnderwriterPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <h1 className="mb-2 text-3xl font-bold text-foreground">Underwriter Resources</h1>
          <p className="mb-8 text-muted-foreground">
            Tools and references for Commercial Underwriters
          </p>

          {/* Link Cards Grid */}
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {underwriterLinks.map((link) => (
              <div
                key={link}
                className="cursor-pointer rounded border border-border bg-white p-4 transition-all hover:border-l-4 hover:border-l-primary"
              >
                <span className="font-bold text-foreground">{link}</span>
              </div>
            ))}
          </div>

          {/* Persona Summary Card */}
          <div className="rounded border border-border border-l-4 border-l-[#C9A84C] bg-white p-6">
            <h2 className="mb-4 text-xl font-bold text-foreground">About the Underwriter</h2>
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-foreground">Traits: </span>
                <span className="text-muted-foreground">Analytical, Precise, Deadline-driven</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">Access: </span>
                <span className="text-muted-foreground">Daily</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">Criticality: </span>
                <span className="text-muted-foreground">Very High</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">Goal: </span>
                <span className="text-muted-foreground">
                  {'"Make informed underwriting decisions quickly and accurately"'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnderwriterPage;
