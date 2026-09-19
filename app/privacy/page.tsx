import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - BudgetMitra",
  description: "How BudgetMitra handles your financial data and privacy.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0f2044] mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-6">Last updated: September 19, 2026</p>

        {/* Core Privacy Highlight */}
        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-lg text-sm text-teal-900 leading-relaxed mb-6">
          Your account data is private to you and accessible only through your logged-in account. We do not encrypt individual fields at rest; access is controlled by your password-protected login.
        </div>

        <Section title="What we collect">
          Transaction details you enter (amount, category, date, description), and
          lending/borrowing entries you add for tracking money between friends.
        </Section>

        <Section title="Account Security">
          Passwords are encrypted using industry-standard bcrypt hashing with a cost factor of 12. Your plaintext password is never stored or logged.
        </Section>

        <Section title="How AI features work">
          When you use transaction categorization, saving tips, or the chat feature, your spending pattern is processed by our AI provider (Groq) to suggest categories or answer your questions. We do not sell your data or use it for third-party advertising.
        </Section>

        <Section title="Your control">
          You can clear all stored transaction and lending data at any time using the &ldquo;Clear my data&rdquo; option in the dashboard.
        </Section>

        <Section title="Contact">
          Questions about this policy can be directed to{" "}
          <a
            href="mailto:nandini19mehra@gmail.com"
            className="text-teal-700 underline"
          >
            nandini19mehra@gmail.com
          </a>
          .
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-[#0f2044] mb-1">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
}
