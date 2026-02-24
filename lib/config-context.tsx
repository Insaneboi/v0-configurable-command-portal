"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface KeyValuePair {
  key: string
  type: "string" | "number" | "float" | "boolean" | "range"
  value: string
  rangeMin?: string
  rangeMax?: string
}

export interface OperationResultEntry {
  resultKey: string
  resultValue: string
}

export interface Configuration {
  id: string
  name: string
  description: string
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected"
  createdAt: Date
  updatedAt: Date
  createdBy: string
  serviceDetails: {
    serviceName: string
    ccsGen: string
    uid: string[]
    gateway: string
    actionType: string
    ucdRefreshApplicable: boolean
    aiviSyncApplicable: boolean
    svtCheck: boolean
    privacyCheck: boolean
    ownershipCheck: boolean
  }
  applicationPayload: {
    keyValues: KeyValuePair[]
  }
  vehiclePayload: {
    dcmVersion: string
    targetId: string
    attributes: (KeyValuePair & { appKey?: string })[]
    vehicleAttributes: KeyValuePair[]
  }
  ackConfig: {
    dcmVersion: string
    targetId: string
    ackSignal: string
    errorSignal: string
  }
  operationResult: {
    dcmVersion: string
    targetId: string
    judgementSignals: string[]
    results: OperationResultEntry[]
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

// Simulated backend data for CCSGen and UIDs
export const BACKEND_CCSGEN_OPTIONS = ["Gen2", "Gen3", "Gen4"]

export const BACKEND_UID_BY_CCSGEN: Record<string, string[]> = {
  Gen2: ["UID-201", "UID-202", "UID-203", "UID-204"],
  Gen3: ["UID-301", "UID-302", "UID-303", "UID-304", "UID-305"],
  Gen4: ["UID-401", "UID-402", "UID-403"],
}

export const GATEWAY_OPTIONS = ["GDC", "Renault", "Nissan"]

export const ERROR_SIGNAL_OPTIONS = [
  "ERR_TIMEOUT",
  "ERR_COMM_FAILURE",
  "ERR_INVALID_RESPONSE",
  "ERR_CRC_MISMATCH",
  "ERR_SEQUENCE",
  "ERR_UNKNOWN",
]

const initialConfigurations: Configuration[] = [
  {
    id: "1",
    name: "ECU Firmware Update - Altima 2024",
    description: "Configuration for ECU firmware update command",
    status: "approved",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    createdBy: "john.doe@nissan.com",
    serviceDetails: {
      serviceName: "ECU Firmware Update",
      ccsGen: "Gen3",
      uid: ["UID-301", "UID-302"],
      gateway: "GDC",
      actionType: "firmware_update",
      ucdRefreshApplicable: true,
      aiviSyncApplicable: false,
      svtCheck: true,
      privacyCheck: true,
      ownershipCheck: false,
    },
    applicationPayload: {
      keyValues: [
        { key: "mode", type: "string", value: "full" },
        { key: "verify", type: "string", value: "true" },
        { key: "target_ecu", type: "string", value: "BCM" },
      ],
    },
    vehiclePayload: {
      dcmVersion: "DCM-3.2.1",
      targetId: "TGT-001",
      attributes: [
        { key: "protocol", type: "string", value: "CAN-FD" },
        { key: "baud_rate", type: "string", value: "500kbps" },
      ],
      vehicleAttributes: [
        { key: "model", type: "string", value: "Altima" },
        { key: "year", type: "string", value: "2024" },
      ],
    },
    ackConfig: {
      dcmVersion: "DCM-3.2.1",
      targetId: "TGT-001",
      ackSignal: "1",
      errorSignal: "ERR_TIMEOUT",
    },
    operationResult: {
      dcmVersion: "DCM-3.2.1",
      targetId: "TGT-001",
      judgementSignals: ["SIG_OK", "SIG_COMPLETE"],
      results: [
        { resultKey: "status", resultValue: "STATUS_OK" },
        { resultKey: "error_handling", resultValue: "ROLLBACK" },
      ],
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
    serviceDetails: {
      serviceName: "Vehicle Diagnostics",
      ccsGen: "Gen3",
      uid: ["UID-303"],
      gateway: "Renault",
      actionType: "diagnostics_run",
      ucdRefreshApplicable: false,
      aiviSyncApplicable: true,
      svtCheck: false,
      privacyCheck: true,
      ownershipCheck: true,
    },
    applicationPayload: {
      keyValues: [
        { key: "depth", type: "string", value: "full" },
        { key: "include_dtc", type: "string", value: "true" },
      ],
    },
    vehiclePayload: {
      dcmVersion: "DCM-3.1.0",
      targetId: "TGT-002",
      attributes: [
        { key: "protocol", type: "string", value: "UDS" },
      ],
      vehicleAttributes: [
        { key: "model", type: "string", value: "Rogue" },
        { key: "year", type: "string", value: "2024" },
      ],
    },
    ackConfig: {
      dcmVersion: "DCM-3.1.0",
      targetId: "TGT-002",
      ackSignal: "1",
      errorSignal: "ERR_COMM_FAILURE",
    },
    operationResult: {
      dcmVersion: "DCM-3.1.0",
      targetId: "TGT-002",
      judgementSignals: ["SIG_DIAG_OK"],
      results: [
        { resultKey: "status", resultValue: "COMPLETE" },
        { resultKey: "error_handling", resultValue: "LOG_AND_CONTINUE" },
      ],
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
    serviceDetails: {
      serviceName: "Battery Management",
      ccsGen: "Gen4",
      uid: ["UID-401", "UID-402"],
      gateway: "GDC",
      actionType: "battery_manage",
      ucdRefreshApplicable: true,
      aiviSyncApplicable: true,
      svtCheck: false,
      privacyCheck: false,
      ownershipCheck: true,
    },
    applicationPayload: {
      keyValues: [
        { key: "optimize", type: "string", value: "true" },
        { key: "report", type: "string", value: "true" },
        { key: "cell_balance", type: "string", value: "enabled" },
      ],
    },
    vehiclePayload: {
      dcmVersion: "DCM-4.0.0",
      targetId: "TGT-003",
      attributes: [
        { key: "protocol", type: "string", value: "CAN-FD" },
        { key: "battery_type", type: "string", value: "Li-ion" },
      ],
      vehicleAttributes: [
        { key: "model", type: "string", value: "LEAF" },
        { key: "year", type: "string", value: "2024" },
        { key: "drivetrain", type: "string", value: "EV" },
      ],
    },
    ackConfig: {
      dcmVersion: "DCM-4.0.0",
      targetId: "TGT-003",
      ackSignal: "0",
      errorSignal: "ERR_CRC_MISMATCH",
    },
    operationResult: {
      dcmVersion: "DCM-4.0.0",
      targetId: "TGT-003",
      judgementSignals: ["SIG_BAT_OK", "SIG_CHARGE_COMPLETE"],
      results: [
        { resultKey: "status", resultValue: "BAT_OK" },
        { resultKey: "error_handling", resultValue: "SAFE_MODE" },
        { resultKey: "logging", resultValue: "DEBUG" },
      ],
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
