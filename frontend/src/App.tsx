import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { OverviewView } from "./components/OverviewView";
import { ForecastExplorerView } from "./components/ForecastExplorerView";
import { AccuracyAnalysisView } from "./components/AccuracyAnalysisView";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { ErrorAlert } from "./components/ErrorAlert";
import { EmptyState } from "./components/EmptyState";
import { useProcurement } from "./module/procurement";

export default function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const {
    startDate,
    endDate,
    cutoffPreset,
    activeTab,
    forecastData,
    accuracyData,
    leadTimeData,
    metadata,
    health,
    selectedInterval,
    selectedVintages,
    isLoading,
    isLoadingVintages,
    error,
    setActiveTab,
    handleDateChange,
    handleCutoffChange,
    inspectInterval,
    refreshData,
  } = useProcurement();

  const hasData = forecastData && forecastData.intervals && forecastData.intervals.length > 0;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] flex">
      {/* Sidebar Navigation & Drawer */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        startDate={startDate}
        endDate={endDate}
        cutoffPreset={cutoffPreset}
        onDateChange={handleDateChange}
        onCutoffChange={handleCutoffChange}
        onRefresh={refreshData}
        isLoading={isLoading}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header - Compact single toolbar */}
        <Header
          health={health}
          metadata={metadata}
          isLoading={isLoading}
          onRefresh={refreshData}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          activeTab={activeTab}
        />

        {/* Main Content Area - Starts immediately below header */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {isLoading && !forecastData ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorAlert message={error} onRetry={refreshData} />
        ) : !hasData ? (
          <EmptyState onReset={() => handleDateChange("2026-01-01", "2026-01-07")} />
        ) : (
          <>
            {activeTab === "overview" && (
              <OverviewView
                forecastData={forecastData}
                accuracyData={accuracyData}
                cutoffPreset={cutoffPreset}
              />
            )}
            {activeTab === "explorer" && (
              <ForecastExplorerView
                forecastData={forecastData}
                selectedInterval={selectedInterval}
                selectedVintages={selectedVintages}
                isLoadingVintages={isLoadingVintages}
                onSelectInterval={inspectInterval}
              />
            )}
            {activeTab === "accuracy" && (
              <AccuracyAnalysisView
                accuracyData={accuracyData}
                leadTimeData={leadTimeData}
              />
            )}
          </>
        )}
      </main>

      {/* Governance & Compliance Footer */}
      <footer className="border-t border-[#E5EAF0] bg-white py-6 text-xs text-[#667085] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="space-y-1">
            <p className="font-semibold text-[#172033]">
              UK Wind Generation Procurement Intelligence Pilot
            </p>
            <p>
              Data Sources: Elexon BMRS FUELHH (WIND) &amp; WINDFOR Streams | Target Period: January 2026
            </p>
          </div>
          <div className="text-[11px] text-[#667085] space-y-0.5">
            <p>Decision-support intelligence only. No price, demand, or contract positions are modeled.</p>
            <p>Built with React, TypeScript, FastAPI, and verified against look-ahead bias.</p>
          </div>
        </div>
      </footer>
    </div>
  </div>
);
}
