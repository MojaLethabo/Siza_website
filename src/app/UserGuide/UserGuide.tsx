"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Book,
  Users,
  BarChart,
  MessageSquare,
  Vote,
  Shield,
  Bell,
  HelpCircle,
  Download,
} from "lucide-react";

// Types
interface ContentSection {
  heading: string;
  content?: string;
  items?: string[];
  steps?: string[];
}

interface GuideSectionContent {
  title: string;
  sections: ContentSection[];
}

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactElement<{ className?: string }>;
  content: GuideSectionContent;
}

// Constants
const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    icon: <Book className="w-4 h-4" />,
    content: {
      title: "Welcome to SIZA Community Leader Guide",
      sections: [
        {
          heading: "Overview",
          content: "This guide helps Community Leaders effectively manage community safety using the SIZA web application.",
        },
        {
          heading: "Quick Start",
          items: [
            "Access your dashboard after login",
            "Monitor active incidents on the map",
            "Manage community members and responses",
            "Use analytics for safety insights",
          ],
        },
      ],
    },
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    icon: <BarChart className="w-4 h-4" />,
    content: {
      title: "Dashboard Features",
      sections: [
        {
          heading: "Real-time Metrics",
          items: [
            "Community Members: Total and active user counts",
            "Incident Reports: Current and historical emergency reports",
            "Response Statistics: Success rates and response times",
          ],
        },
        {
          heading: "Incident Map",
          items: [
            "Red markers: Active emergencies",
            "Green markers: Resolved incidents",
            "Click markers for detailed reports",
          ],
        },
        {
          heading: "Quick Actions",
          items: [
            "Access user management directly",
            "View recent notifications",
            "Check analytics trends",
          ],
        },
      ],
    },
  },
  {
    id: "user-management",
    title: "User Management",
    icon: <Users className="w-4 h-4" />,
    content: {
      title: "Managing Community Members",
      sections: [
        {
          heading: "Member Overview",
          items: [
            "View all community members with activity status",
            "Monitor response counts and participation",
            "Track flags and misuse reports",
          ],
        },
        {
          heading: "Sleep Mode (Temporary Restriction)",
          steps: [
            "Click 'Sleep' button next to member",
            "Select restriction type: Broadcast Only, Report Only, or Both Features",
            "Set duration (1-720 hours)",
            "Confirm restriction",
          ],
        },
        {
          heading: "View Member Details",
          items: [
            "Click member name to view full profile",
            "Access response history",
            "Review flags and misuse reports",
          ],
        },
        {
          heading: "Flag & Misuse Management",
          items: [
            "Red indicators show active flags",
            "Click flags to view details",
            "Use modals for case review",
          ],
        },
      ],
    },
  },
  {
    id: "analytics",
    title: "Analytics & Reports",
    icon: <BarChart className="w-4 h-4" />,
    content: {
      title: "Analytics Dashboard",
      sections: [
        {
          heading: "Reports Analytics",
          items: [
            "Time Frame Selection: Day, Week, Month, Year",
            "Incident Trends: Visual charts of report frequency",
            "Type Distribution: Emergency category breakdown",
            "Response Metrics: Completion rates and timelines",
          ],
        },
        {
          heading: "Heatmap Analytics",
          items: [
            "Geographic visualization of incidents",
            "Filter by emergency type (Crime, Fire, Medical, etc.)",
            "Temporal analysis for pattern recognition",
            "Suburb-specific data filtering",
          ],
        },
        {
          heading: "Data Export",
          items: [
            "Download reports as CSV/PDF",
            "Export charts and graphs",
            "Custom date range selection",
          ],
        },
      ],
    },
  },
  {
    id: "broadcast",
    title: "Broadcast System",
    icon: <MessageSquare className="w-4 h-4" />,
    content: {
      title: "Emergency Broadcast Management",
      sections: [
        {
          heading: "Sending Broadcasts",
          steps: [
            "Navigate to Broadcast section",
            "Type your emergency message",
            "Attach images if needed (optional)",
            "Click send to notify entire community",
          ],
        },
        {
          heading: "Message Moderation",
          items: [
            "View all community messages",
            "Disable inappropriate content",
            "Restore messages if needed",
            "Monitor channel activity",
          ],
        },
        {
          heading: "Channel Features",
          items: [
            "Melville Emergency Channel (Primary)",
            "Real-time message updates",
            "User activity monitoring",
            "Message history tracking",
          ],
        },
      ],
    },
  },
  {
    id: "voting",
    title: "Voting Sessions",
    icon: <Vote className="w-4 h-4" />,
    content: {
      title: "Voting Session Management",
      sections: [
        {
          heading: "Session Controls",
          items: [
            "Start/Stop Voting: Toggle voting sessions",
            "Time Settings: 24-hour or 1-week durations",
            "Participant Monitoring: Track voter turnout",
          ],
        },
        {
          heading: "Nomination Process",
          items: [
            "View all candidate nominations",
            "Monitor vote counts in real-time",
            "Access nominee details",
          ],
        },
        {
          heading: "Promoting Leaders",
          content: "After successful voting:",
          steps: [
            "Verify election results",
            "Click 'Promote to Community Leader'",
            "System updates permissions automatically",
            "Announce new leader to community",
          ],
        },
      ],
    },
  },
  {
    id: "support",
    title: "Support & Moderation",
    icon: <Shield className="w-4 h-4" />,
    content: {
      title: "Support Dashboard",
      sections: [
        {
          heading: "Case Management",
          items: [
            "Misuse Reports: Community guideline violations",
            "Flagged Content: Inappropriate messages",
            "Status Tracking: Pending → Reviewed → Resolved",
          ],
        },
        {
          heading: "Workflow",
          steps: [
            "Review new cases in Support section",
            "Click cases for detailed investigation",
            "Communicate with involved parties",
            "Apply resolutions (warnings, restrictions)",
            "Close cases with documentation",
          ],
        },
        {
          heading: "Quick Actions",
          items: [
            "Filter by case type and status",
            "Search specific cases by ID",
            "Bulk status updates",
          ],
        },
      ],
    },
  },
  {
    id: "notifications",
    title: "Notification System",
    icon: <Bell className="w-4 h-4" />,
    content: {
      title: "Alert Management",
      sections: [
        {
          heading: "Notification Types",
          items: [
            "🔴 Emergency Alerts: Immediate incident notifications",
            "🔵 System Updates: Platform maintenance info",
            "🟡 Moderation Requests: Approval needed",
            "🟢 Community Updates: General announcements",
          ],
        },
        {
          heading: "Management Features",
          items: [
            "Bell icon shows unread count",
            "Click to view notification details",
            "Mark individual or all as read",
            "Settings for custom preferences",
          ],
        },
      ],
    },
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: <HelpCircle className="w-4 h-4" />,
    content: {
      title: "Common Issues & Solutions",
      sections: [
        {
          heading: "Login Problems",
          content: "Issue: Can't access account",
          items: [
            "Use password reset function",
            "Clear browser cache/cookies",
            "Check internet connection",
          ],
        },
        {
          heading: "Map Not Loading",
          content: "Issue: Incident map displays incorrectly",
          items: [
            "Refresh the page",
            "Check location permissions",
            "Try different browser",
          ],
        },
        {
          heading: "Data Not Updating",
          content: "Issue: Analytics or reports show old data",
          items: [
            "Click refresh button",
            "Check time frame settings",
            "Wait for automatic sync (5-minute intervals)",
          ],
        },
        {
          heading: "Performance Issues",
          content: "Issue: Application runs slowly",
          items: [
            "Close other browser tabs",
            "Clear browser cache",
            "Check internet speed",
          ],
        },
      ],
    },
  },
];

// Components
const SearchBar: React.FC<{
  searchTerm: string;
  onSearchChange: (value: string) => void;
}> = ({ searchTerm, onSearchChange }) => (
  <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
    <div className="relative max-w-2xl mx-auto">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder="Search guide topics..."
        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all text-lg"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  </div>
);

const SectionNavigation: React.FC<{
  sections: GuideSection[];
  activeSection: string | null;
  onSectionClick: (sectionId: string) => void;
}> = ({ sections, activeSection, onSectionClick }) => (
  <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 sticky top-6">
    <div className="p-6 border-b border-gray-200">
      <h2 className="font-bold text-gray-900 text-xl">Guide Sections</h2>
    </div>
    <nav className="p-4">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSectionClick(section.id)}
          className={`w-full flex items-center justify-between p-4 rounded-xl mb-2 transition-all duration-200 ${
            activeSection === section.id
              ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg"
              : "text-gray-700 hover:bg-gray-100 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3">
            {React.cloneElement(section.icon, {
              className: "w-5 h-5",
            })}
            <span className="font-medium text-left text-lg">{section.title}</span>
          </div>
          {activeSection === section.id ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      ))}
    </nav>
  </div>
);

const ContentRenderer: React.FC<{ content: GuideSectionContent }> = ({ content }) => (
  <div className="space-y-8">
    {content.sections.map((section: ContentSection, index: number) => (
      <div key={index} className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-blue-600 rounded-full"></div>
          {section.heading}
        </h3>

        {section.content && (
          <p className="text-gray-600 italic text-lg mb-3 leading-relaxed">{section.content}</p>
        )}

        {section.items && (
          <ul className="space-y-3">
            {section.items.map((item: string, itemIndex: number) => (
              <li
                key={itemIndex}
                className="flex items-start gap-4 text-gray-700 text-lg leading-relaxed"
              >
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {section.steps && (
          <ol className="space-y-4">
            {section.steps.map((step: string, stepIndex: number) => (
              <li
                key={stepIndex}
                className="flex items-start gap-4 text-gray-700 text-lg leading-relaxed"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
                  {stepIndex + 1}
                </div>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    ))}
  </div>
);

const SectionContent: React.FC<{
  section: GuideSection;
  isActive: boolean;
  onDownloadPDF: () => void;
}> = ({ section, isActive, onDownloadPDF }) => (
  <div
    className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-8 transition-all duration-300 ${
      isActive ? "block" : "hidden"
    }`}
  >
    <div className="p-10">
      <div className="mb-8">
        <div className="flex items-center gap-6 mb-6">
          <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl">
            {React.cloneElement(section.icon, {
              className: "w-8 h-8 text-white",
            })}
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {section.content.title}
          </h1>
        </div>
      </div>

      <div className="max-w-none text-lg">
        <ContentRenderer content={section.content} />
      </div>
    </div>

    <div className="border-t border-gray-200 bg-gray-50/80 backdrop-blur-sm p-8 rounded-b-2xl">
      <div className="flex flex-wrap gap-4">
        <button
          onClick={onDownloadPDF}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold hover:shadow-xl transition-all duration-200 inline-flex items-center gap-4 text-lg"
        >
          <Download className="w-6 h-6" />
          Download Full PDF Guide
        </button>
      </div>
    </div>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-16 text-center">
    <div className="p-6 bg-gray-100 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
      <Search className="w-16 h-16 text-gray-400" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">No results found</h3>
    <p className="text-gray-600 text-xl">
      Try searching with different keywords or browse the sections above.
    </p>
  </div>
);

const Footer: React.FC = () => (
  <div className="text-center mt-16 pt-12 border-t border-white/20">
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
      <p className="text-white/90 font-semibold text-lg">
        SIZA Community Leader Guide • Version 1.0 • Last updated September 2025
      </p>
      <p className="text-white/70 text-base mt-3">
        For the most current information, always check the in-app help section.
      </p>
    </div>
  </div>
);

const Header: React.FC = () => (
  <div className="text-center mb-12">
    <div className="inline-flex items-center gap-6 bg-white/95 backdrop-blur-sm px-12 py-6 rounded-3xl shadow-2xl border border-white/20 mb-8">
      <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl">
        <Book className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
        SIZA Community Leader Guide
      </h1>
    </div>
    <p className="text-white/90 max-w-4xl mx-auto text-xl font-medium leading-relaxed">
      Comprehensive guide for managing community safety and emergency response systems
    </p>
  </div>
);

// Main Component
const UserGuide = () => {
  const [activeSection, setActiveSection] = useState<string | null>("introduction");
  const [searchTerm, setSearchTerm] = useState("");

  const handleDownloadPDF = () => {
    const link = document.createElement("a");
    link.href = "/WEBAPP_UserGuide.pdf";
    link.download = "SIZA_Community_Leader_Guide.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSections = GUIDE_SECTIONS.filter(
    (section) =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(section.content)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-600">
      <div className="max-w-9xl mx-auto px-8 py-12">
        <Header />
        
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
        />

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
          {/* Sidebar Navigation - Wider */}
          <div className="xl:col-span-1">
            <SectionNavigation
              sections={filteredSections}
              activeSection={activeSection}
              onSectionClick={toggleSection}
            />
          </div>

          {/* Main Content - Much Wider */}
          <div className="xl:col-span-4">
            {filteredSections.map((section) => (
              <SectionContent
                key={section.id}
                section={section}
                isActive={activeSection === section.id}
                onDownloadPDF={handleDownloadPDF}
              />
            ))}

            {filteredSections.length === 0 && <EmptyState />}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default UserGuide;