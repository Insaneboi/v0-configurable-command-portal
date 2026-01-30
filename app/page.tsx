"use client"

import { useState } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { ConfigProvider, type Configuration } from "@/lib/config-context"
import { LoginForm } from "@/components/login-form"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardOverview } from "@/components/dashboard-overview"
import { ConfigurationList } from "@/components/configuration-list"
import { ConfigurationWizard } from "@/components/configuration-wizard"
import { ApprovalQueue } from "@/components/approval-queue"
import { NissanLogo } from "@/components/nissan-logo"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud, HardDrive, Database, FileJson } from "lucide-react"

function MasterDataView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Master Info Storage</h1>
        <p className="text-muted-foreground mt-1">
          External data sources for configuration management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              UID / CCSGen Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Centralized storage for unique identifiers and CCS generation codes.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Total UIDs</span>
                <span className="font-medium text-foreground">1,247</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">CCS Generations</span>
                <span className="font-medium text-foreground">Gen2, Gen3, Gen4</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Last Sync</span>
                <span className="font-medium text-foreground">2 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Gateways Registry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Available gateway configurations for vehicle communication.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">CAN Gateways</span>
                <span className="font-medium text-foreground">CAN-GW-01, CAN-GW-02</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">EV Gateways</span>
                <span className="font-medium text-foreground">EV-GW-01</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">LIN Gateways</span>
                <span className="font-medium text-foreground">LIN-GW-01</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <FileJson className="h-5 w-5 text-primary" />
              Signals Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Predefined signal definitions for command configurations.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Total Signals</span>
                <span className="font-medium text-foreground">3,892</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Categories</span>
                <span className="font-medium text-foreground">ECU, BAT, DIAG, TELE</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium text-foreground">Jan 15, 2024</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              External API Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Connection status to external master data services.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Vehicle Registry API</span>
                <span className="flex items-center gap-1 text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">ECU Catalog API</span>
                <span className="flex items-center gap-1 text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Signal Library API</span>
                <span className="flex items-center gap-1 text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Online
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FileStorageView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">File Storage</h1>
        <p className="text-muted-foreground mt-1">
          Approved configurations are automatically stored here
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            Storage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-foreground">12</p>
              <p className="text-sm text-muted-foreground">Total Files</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-foreground">3.2 MB</p>
              <p className="text-sm text-muted-foreground">Total Size</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-foreground">JSON</p>
              <p className="text-sm text-muted-foreground">File Format</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Stored Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "config_ecu_altima_2024_001.json", date: "Jan 20, 2024", size: "256 KB" },
              { name: "config_diag_rogue_2024_002.json", date: "Jan 18, 2024", size: "189 KB" },
              { name: "config_bat_leaf_2024_003.json", date: "Jan 15, 2024", size: "312 KB" },
            ].map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileJson className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.date}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{file.size}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> File storage automation is in progress. 
          Upon approval, configurations will be automatically exported to the designated storage location.
        </p>
      </div>
    </div>
  )
}

function AppContent() {
  const { isAuthenticated } = useAuth()
  const [currentView, setCurrentView] = useState("dashboard")
  const [editingConfig, setEditingConfig] = useState<Configuration | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => setCurrentView("dashboard")} />
  }

  const handleCreateNew = () => {
    setEditingConfig(null)
    setIsCreating(true)
  }

  const handleEdit = (config: Configuration) => {
    setEditingConfig(config)
    setIsCreating(true)
  }

  const handleCloseWizard = () => {
    setEditingConfig(null)
    setIsCreating(false)
  }

  const renderContent = () => {
    if (isCreating) {
      return <ConfigurationWizard editConfig={editingConfig} onClose={handleCloseWizard} />
    }

    switch (currentView) {
      case "dashboard":
        return <DashboardOverview />
      case "configurations":
        return (
          <ConfigurationList
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onView={(config) => console.log("[v0] View config:", config)}
          />
        )
      case "approvals":
        return <ApprovalQueue />
      case "master-data":
        return <MasterDataView />
      case "file-storage":
        return <FileStorageView />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        currentView={isCreating ? "configurations" : currentView}
        onViewChange={(view) => {
          setIsCreating(false)
          setCurrentView(view)
        }}
      />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NissanLogo className="h-6 w-auto text-primary md:hidden" />
            <h2 className="text-sm font-medium text-muted-foreground">
              Configurable Command Portal
            </h2>
          </div>
        </header>
        <div className="p-6">{renderContent()}</div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <AppContent />
      </ConfigProvider>
    </AuthProvider>
  )
}
