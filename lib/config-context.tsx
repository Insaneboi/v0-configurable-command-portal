"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface Configuration {
  id: string
  name: string
  description: string
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected"
  createdAt: Date
  updatedAt: Date
  createdBy: string
  masterConfig: {
    uid: string
    ccsGen: string
    gateway: string
    signals: string[]
  }
  applicationPayload: {
    appId: string
    version: string
    endpoint: string
    parameters: Record<string, string>
  }
  vehiclePayload: {
    vehicleModel: string
    year: string
    vin: string
    ecuType: string
  }
  ackConfig: {
    timeout: number
    retryCount: number
    acknowledgmentType: string
  }
  operationResult: {
    successCriteria: string
    errorHandling: string
    loggingLevel: string
  }
  approvalComments?: string
  approvedBy?: string
  approvedAt?: Date
}

interface ConfigContextType {
  configurations: Configuration[]
  currentConfig: Partial<Configuration> | null
  setCurrentConfig: (config: Partial<Configuration> | null) => void
  saveConfiguration: (config: Configuration) => void
  submitForApproval: (id: string) => void
  approveConfiguration: (id: string, comments: string) => void
  rejectConfiguration: (id: string, comments: string) => void
  getConfigurationById: (id: string) => Configuration | undefined
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

const initialConfigurations: Configuration[] = [
  {
    id: "1",
    name: "ECU Firmware Update - Altima 2024",
    description: "Configuration for ECU firmware update command",
    status: "approved",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    createdBy: "john.doe@nissan.com",
    masterConfig: {
      uid: "UID-001",
      ccsGen: "Gen3",
      gateway: "CAN-GW-01",
      signals: ["SIG_001", "SIG_002"],
    },
    applicationPayload: {
      appId: "APP-ECU-001",
      version: "2.1.0",
      endpoint: "/api/v1/ecu/update",
      parameters: { mode: "full", verify: "true" },
    },
    vehiclePayload: {
      vehicleModel: "Altima",
      year: "2024",
      vin: "1N4BL4BV*NC******",
      ecuType: "BCM",
    },
    ackConfig: {
      timeout: 30000,
      retryCount: 3,
      acknowledgmentType: "SYNC",
    },
    operationResult: {
      successCriteria: "STATUS_OK",
      errorHandling: "ROLLBACK",
      loggingLevel: "DEBUG",
    },
    approvedBy: "admin@nissan.com",
    approvedAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    name: "Diagnostics Command - Rogue 2024",
    description: "Vehicle diagnostics configuration",
    status: "submitted",
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-18"),
    createdBy: "jane.smith@nissan.com",
    masterConfig: {
      uid: "UID-002",
      ccsGen: "Gen3",
      gateway: "CAN-GW-02",
      signals: ["SIG_003"],
    },
    applicationPayload: {
      appId: "APP-DIAG-001",
      version: "1.5.0",
      endpoint: "/api/v1/diagnostics/run",
      parameters: { depth: "full" },
    },
    vehiclePayload: {
      vehicleModel: "Rogue",
      year: "2024",
      vin: "5N1AT3BB*NC******",
      ecuType: "PCM",
    },
    ackConfig: {
      timeout: 60000,
      retryCount: 2,
      acknowledgmentType: "ASYNC",
    },
    operationResult: {
      successCriteria: "COMPLETE",
      errorHandling: "LOG_AND_CONTINUE",
      loggingLevel: "INFO",
    },
  },
  {
    id: "3",
    name: "Battery Management - LEAF 2024",
    description: "EV battery management command configuration",
    status: "draft",
    createdAt: new Date("2024-01-22"),
    updatedAt: new Date("2024-01-22"),
    createdBy: "john.doe@nissan.com",
    masterConfig: {
      uid: "UID-003",
      ccsGen: "Gen4",
      gateway: "EV-GW-01",
      signals: ["SIG_BAT_001", "SIG_BAT_002", "SIG_BAT_003"],
    },
    applicationPayload: {
      appId: "APP-BAT-001",
      version: "3.0.0",
      endpoint: "/api/v1/battery/manage",
      parameters: { optimize: "true", report: "true" },
    },
    vehiclePayload: {
      vehicleModel: "LEAF",
      year: "2024",
      vin: "1N4AZ1CP*NC******",
      ecuType: "BMS",
    },
    ackConfig: {
      timeout: 120000,
      retryCount: 5,
      acknowledgmentType: "SYNC",
    },
    operationResult: {
      successCriteria: "BAT_OK",
      errorHandling: "SAFE_MODE",
      loggingLevel: "DEBUG",
    },
  },
]

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [configurations, setConfigurations] = useState<Configuration[]>(initialConfigurations)
  const [currentConfig, setCurrentConfig] = useState<Partial<Configuration> | null>(null)

  const saveConfiguration = (config: Configuration) => {
    setConfigurations((prev) => {
      const exists = prev.find((c) => c.id === config.id)
      if (exists) {
        return prev.map((c) => (c.id === config.id ? config : c))
      }
      return [...prev, config]
    })
  }

  const submitForApproval = (id: string) => {
    setConfigurations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "submitted" as const, updatedAt: new Date() } : c
      )
    )
  }

  const approveConfiguration = (id: string, comments: string) => {
    setConfigurations((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "approved" as const,
              approvalComments: comments,
              approvedAt: new Date(),
              updatedAt: new Date(),
            }
          : c
      )
    )
  }

  const rejectConfiguration = (id: string, comments: string) => {
    setConfigurations((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "rejected" as const,
              approvalComments: comments,
              updatedAt: new Date(),
            }
          : c
      )
    )
  }

  const getConfigurationById = (id: string) => {
    return configurations.find((c) => c.id === id)
  }

  return (
    <ConfigContext.Provider
      value={{
        configurations,
        currentConfig,
        setCurrentConfig,
        saveConfiguration,
        submitForApproval,
        approveConfiguration,
        rejectConfiguration,
        getConfigurationById,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider")
  }
  return context
}
