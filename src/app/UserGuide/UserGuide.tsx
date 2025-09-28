"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Book,
  Users,
  Map,
  BarChart,
  MessageSquare,
  Vote,
  Shield,
  Bell,
  Settings,
  HelpCircle,
} from "lucide-react";

const UserGuide = () => {
  const [activeSection, setActiveSection] = useState<string | null>(
    "introduction"
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Guide content structure
  const guideSections = [
    {
      id: "introduction",
      title: "Introduction",
      icon: <Book className="w-4 h-4" />,
      content: `
        # Welcome to SIZA Community Leader Guide
        
        This guide helps Community Leaders effectively manage community safety using the SIZA web application.
        
        ## Quick Start
        - Access your dashboard after login
        - Monitor active incidents on the map
        - Manage community members and responses
        - Use analytics for safety insights
      `,
    },
    {
      id: "dashboard",
      title: "Dashboard Overview",
      icon: <BarChart className="w-4 h-4" />,
      content: `
        # Dashboard Features
        
        ## Real-time Metrics
        - **Community Members**: Total and active user counts
        - **Incident Reports**: Current and historical emergency reports
        - **Response Statistics**: Success rates and response times
        
        ## Incident Map
        - Red markers: Active emergencies
        - Green markers: Resolved incidents
        - Click markers for detailed reports
        
        ## Quick Actions
        - Access user management directly
        - View recent notifications
        - Check analytics trends
      `,
    },
    {
      id: "user-management",
      title: "User Management",
      icon: <Users className="w-4 h-4" />,
      content: `
        # Managing Community Members
        
        ## Member Overview
        - View all community members with activity status
        - Monitor response counts and participation
        - Track flags and misuse reports
        
        ## Member Actions
        
        ### Sleep Mode (Temporary Restriction)
        1. Click "Sleep" button next to member
        2. Select restriction type:
           - Broadcast Only
           - Report Only  
           - Both Features
        3. Set duration (1-720 hours)
        4. Confirm restriction
        
        ### View Member Details
        - Click member name to view full profile
        - Access response history
        - Review flags and misuse reports
        
        ## Flag & Misuse Management
        - Red indicators show active flags
        - Click flags to view details
        - Use modals for case review
      `,
    },
    {
      id: "analytics",
      title: "Analytics & Reports",
      icon: <BarChart className="w-4 h-4" />,
      content: `
        # Analytics Dashboard
        
        ## Reports Analytics
        - **Time Frame Selection**: Day, Week, Month, Year
        - **Incident Trends**: Visual charts of report frequency
        - **Type Distribution**: Emergency category breakdown
        - **Response Metrics**: Completion rates and timelines
        
        ## Heatmap Analytics
        - Geographic visualization of incidents
        - Filter by emergency type (Crime, Fire, Medical, etc.)
        - Temporal analysis for pattern recognition
        - Suburb-specific data filtering
        
        ## Data Export
        - Download reports as CSV/PDF
        - Export charts and graphs
        - Custom date range selection
      `,
    },
    {
      id: "broadcast",
      title: "Broadcast System",
      icon: <MessageSquare className="w-4 h-4" />,
      content: `
        # Emergency Broadcast Management
        
        ## Sending Broadcasts
        1. Navigate to Broadcast section
        2. Type your emergency message
        3. Attach images if needed (optional)
        4. Click send to notify entire community
        
        ## Message Moderation
        - View all community messages
        - Disable inappropriate content
        - Restore messages if needed
        - Monitor channel activity
        
        ## Channel Features
        - Melville Emergency Channel (Primary)
        - Real-time message updates
        - User activity monitoring
        - Message history tracking
      `,
    },
    {
      id: "voting",
      title: "Voting Sessions",
      icon: <Vote className="w-4 h-4" />,
      content: `
        # Voting Session Management
        
        ## Session Controls
        - **Start/Stop Voting**: Toggle voting sessions
        - **Time Settings**: 24-hour or 1-week durations
        - **Participant Monitoring**: Track voter turnout
        
        ## Nomination Process
        - View all candidate nominations
        - Monitor vote counts in real-time
        - Access nominee details
        
        ## Promoting Leaders
        After successful voting:
        1. Verify election results
        2. Click "Promote to Community Leader"
        3. System updates permissions automatically
        4. Announce new leader to community
      `,
    },
    {
      id: "support",
      title: "Support & Moderation",
      icon: <Shield className="w-4 h-4" />,
      content: `
        # Support Dashboard
        
        ## Case Management
        - **Misuse Reports**: Community guideline violations
        - **Flagged Content**: Inappropriate messages
        - **Status Tracking**: Pending → Reviewed → Resolved
        
        ## Workflow
        1. Review new cases in Support section
        2. Click cases for detailed investigation
        3. Communicate with involved parties
        4. Apply resolutions (warnings, restrictions)
        5. Close cases with documentation
        
        ## Quick Actions
        - Filter by case type and status
        - Search specific cases by ID
        - Bulk status updates
      `,
    },
    {
      id: "notifications",
      title: "Notification System",
      icon: <Bell className="w-4 h-4" />,
      content: `
        # Alert Management
        
        ## Notification Types
        - 🔴 Emergency Alerts: Immediate incident notifications
        - 🔵 System Updates: Platform maintenance info
        - 🟡 Moderation Requests: Approval needed
        - 🟢 Community Updates: General announcements
        
        ## Management Features
        - Bell icon shows unread count
        - Click to view notification details
        - Mark individual or all as read
        - Settings for custom preferences
      `,
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: <HelpCircle className="w-4 h-4" />,
      content: `
        # Common Issues & Solutions
        
        ## Login Problems
        **Issue**: Can't access account
        **Solution**: 
        - Use password reset function
        - Clear browser cache/cookies
        - Check internet connection
        
        ## Map Not Loading
        **Issue**: Incident map displays incorrectly
        **Solution**:
        - Refresh the page
        - Check location permissions
        - Try different browser
        
        ## Data Not Updating
        **Issue**: Analytics or reports show old data
        **Solution**:
        - Click refresh button
        - Check time frame settings
        - Wait for automatic sync (5-minute intervals)
        
        ## Performance Issues
        **Issue**: Application runs slowly
        **Solution**:
        - Close other browser tabs
        - Clear browser cache
        - Check internet speed
        
        ## Emergency Contact
        For urgent technical issues:
        - Use in-app support system
        - Contact system administrator
        - Emergency hotline: [Your Support Number]
      `,
    },
  ];

  // Filter sections based on search
  const filteredSections = guideSections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const renderContent = (content: string) => {
    return content.split("\n").map((line, index) => {
      if (line.startsWith("# ")) {
        return (
          <h1 key={index} className="text-2xl font-bold text-gray-900 mb-4">
            {line.replace("# ", "")}
          </h1>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2
            key={index}
            className="text-xl font-semibold text-gray-800 mt-6 mb-3"
          >
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("- **")) {
        const parts = line.split("**");
        return (
          <li key={index} className="ml-4 mb-1">
            <strong>{parts[1]}</strong>: {parts[2]}
          </li>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <li key={index} className="ml-4 mb-1">
            {line.replace("- ", "")}
          </li>
        );
      }
      if (line.startsWith("1. ")) {
        return (
          <li key={index} className="ml-4 mb-1">
            {line.replace("1. ", "")}
          </li>
        );
      }
      if (line.trim() === "") {
        return <br key={index} />;
      }
      return (
        <p key={index} className="mb-2 text-gray-700">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border mb-4">
            <Book className="w-6 h-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              SIZA Community Leader Guide
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive guide for managing community safety and emergency
            response systems
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search guide topics..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border sticky top-6">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Guide Sections</h2>
              </div>
              <nav className="p-2">
                {filteredSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg mb-1 transition-colors ${
                      activeSection === section.id
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <span className="font-medium">{section.title}</span>
                    </div>
                    {activeSection === section.id ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Help Card */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">Quick Help</h3>
              </div>
              <p className="text-yellow-700 text-sm mb-3">
                Need immediate assistance?
              </p>
              <button className="w-full bg-yellow-100 text-yellow-800 py-2 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors">
                Contact Support
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {filteredSections.map((section) => (
              <div
                key={section.id}
                className={`bg-white rounded-lg shadow-sm border mb-6 transition-all duration-300 ${
                  activeSection === section.id ? "block" : "hidden"
                }`}
              >
                <div className="p-6">
                  <div className="prose max-w-none">
                    {renderContent(section.content)}
                  </div>
                </div>

                {/* Quick Actions Footer */}
                <div className="border-t bg-gray-50 p-4">
                  <div className="flex flex-wrap gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      Print This Section
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                      Save as PDF
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                      Share Guide
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {filteredSections.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600">
                  Try searching with different keywords or browse the sections
                  above.
                </p>
              </div>
            )}

            {/* Emergency Contact Card */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-red-800">
                  Emergency Technical Support
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-red-700 font-medium mb-2">
                    Urgent Issues:
                  </p>
                  <ul className="text-red-600 text-sm space-y-1">
                    <li>• System outage or downtime</li>
                    <li>• Critical security concerns</li>
                    <li>• Emergency response system failure</li>
                  </ul>
                </div>
                <div>
                  <p className="text-red-700 font-medium mb-2">Contact:</p>
                  <ul className="text-red-600 text-sm space-y-1">
                    <li>• Support Hotline: (555) 123-HELP</li>
                    <li>• Emergency Email: emergency@siza.com</li>
                    <li>• On-call Technician: 24/7 Available</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            SIZA Community Leader Guide • Version 1.0 • Last updated September
            2025
          </p>
          <p className="text-gray-500 text-xs mt-2">
            For the most current information, always check the in-app help
            section.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
