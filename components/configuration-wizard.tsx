"use client"

import { useState } from "react"
import { useConfig, type Configuration } from "@/lib/config-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Check,
  AlertCircle,
  Settings,
  Smartphone,
  Car,
  Bell,
  Activity,
} from "lucide-react"

interface ConfigWizardProps {
  editConfig?: Configuration | null
  onClose: () => void
}

const steps = [
  { id: 1, name: "Master Config", icon: Settings, description: "UID, CCSGen, Gateway, Signals" },
  { id: 2, name: "Application Payload", icon: Smartphone, description: "App ID, Version, Endpoint" },
  { id: 3, name: "Vehicle Payload", icon: Car, description: "Model, Year, VIN, ECU Type" },
  { id: 4, name: "ACK Config", icon: Bell, description: "Timeout, Retry, ACK Type" },
  { id: 5, name: "Operation Result", icon: Activity, description: "Success Criteria, Error Handling" },
]

const vehicleModels = ["Altima", "Rogue", "Sentra", "Pathfinder", "LEAF", "Maxima", "Murano", "Titan", "Kicks", "Versa"]
const ecuTypes = ["BCM", "PCM", "ECM", "TCM", "BMS", "ABS", "SRS", "HVAC"]
const ccsGenOptions = ["Gen2", "Gen3", "Gen4"]
const gatewayOptions = ["CAN-GW-01", "CAN-GW-02", "EV-GW-01", "LIN-GW-01"]
const ackTypes = ["SYNC", "ASYNC", "NONE"]
const loggingLevels = ["DEBUG", "INFO", "WARN", "ERROR"]
const errorHandlingOptions = ["ROLLBACK", "LOG_AND_CONTINUE", "SAFE_MODE", "ABORT"]

export function ConfigurationWizard({ editConfig, onClose }: ConfigWizardProps) {
  const { saveConfiguration, submitForApproval } = useConfig()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: editConfig?.name || "",
    description: editConfig?.description || "",
    // Master Config
    uid: editConfig?.masterConfig?.uid || "",
    ccsGen: editConfig?.masterConfig?.ccsGen || "",
    gateway: editConfig?.masterConfig?.gateway || "",
    signals: editConfig?.masterConfig?.signals?.join(", ") || "",
    // Application Payload
    appId: editConfig?.applicationPayload?.appId || "",
    appVersion: editConfig?.applicationPayload?.version || "",
    endpoint: editConfig?.applicationPayload?.endpoint || "",
    parameters: editConfig?.applicationPayload?.parameters 
      ? Object.entries(editConfig.applicationPayload.parameters).map(([k, v]) => `${k}=${v}`).join(", ")
      : "",
    // Vehicle Payload
    vehicleModel: editConfig?.vehiclePayload?.vehicleModel || "",
    year: editConfig?.vehiclePayload?.year || "",
    vin: editConfig?.vehiclePayload?.vin || "",
    ecuType: editConfig?.vehiclePayload?.ecuType || "",
    // ACK Config
    timeout: editConfig?.ackConfig?.timeout?.toString() || "30000",
    retryCount: editConfig?.ackConfig?.retryCount?.toString() || "3",
    acknowledgmentType: editConfig?.ackConfig?.acknowledgmentType || "",
    // Operation Result
    successCriteria: editConfig?.operationResult?.successCriteria || "",
    errorHandling: editConfig?.operationResult?.errorHandling || "",
    loggingLevel: editConfig?.operationResult?.loggingLevel || "",
  })

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.name) errors.name = "Configuration name is required"
      if (!formData.uid) errors.uid = "UID is required"
      if (!formData.ccsGen) errors.ccsGen = "CCS Generation is required"
      if (!formData.gateway) errors.gateway = "Gateway is required"
    } else if (step === 2) {
      if (!formData.appId) errors.appId = "Application ID is required"
      if (!formData.appVersion) errors.appVersion = "Version is required"
      if (!formData.endpoint) errors.endpoint = "Endpoint is required"
    } else if (step === 3) {
      if (!formData.vehicleModel) errors.vehicleModel = "Vehicle model is required"
      if (!formData.year) errors.year = "Year is required"
      if (!formData.ecuType) errors.ecuType = "ECU type is required"
    } else if (step === 4) {
      if (!formData.timeout) errors.timeout = "Timeout is required"
      if (!formData.acknowledgmentType) errors.acknowledgmentType = "ACK type is required"
    } else if (step === 5) {
      if (!formData.successCriteria) errors.successCriteria = "Success criteria is required"
      if (!formData.errorHandling) errors.errorHandling = "Error handling is required"
      if (!formData.loggingLevel) errors.loggingLevel = "Logging level is required"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const buildConfiguration = (status: Configuration["status"]): Configuration => {
    const parameters: Record<string, string> = {}
    formData.parameters.split(",").forEach((param) => {
      const [key, value] = param.trim().split("=")
      if (key && value) parameters[key] = value
    })

    return {
      id: editConfig?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      status,
      createdAt: editConfig?.createdAt || new Date(),
      updatedAt: new Date(),
      createdBy: editConfig?.createdBy || user?.email || "",
      masterConfig: {
        uid: formData.uid,
        ccsGen: formData.ccsGen,
        gateway: formData.gateway,
        signals: formData.signals.split(",").map((s) => s.trim()).filter(Boolean),
      },
      applicationPayload: {
        appId: formData.appId,
        version: formData.appVersion,
        endpoint: formData.endpoint,
        parameters,
      },
      vehiclePayload: {
        vehicleModel: formData.vehicleModel,
        year: formData.year,
        vin: formData.vin,
        ecuType: formData.ecuType,
      },
      ackConfig: {
        timeout: parseInt(formData.timeout) || 30000,
        retryCount: parseInt(formData.retryCount) || 3,
        acknowledgmentType: formData.acknowledgmentType,
      },
      operationResult: {
        successCriteria: formData.successCriteria,
        errorHandling: formData.errorHandling,
        loggingLevel: formData.loggingLevel,
      },
    }
  }

  const handleSaveDraft = () => {
    const config = buildConfiguration("draft")
    saveConfiguration(config)
    onClose()
  }

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      const config = buildConfiguration("submitted")
      saveConfiguration(config)
      submitForApproval(config.id)
      onClose()
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="name" className="text-foreground">Configuration Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="e.g., ECU Firmware Update - Altima 2024"
                  className={validationErrors.name ? "border-destructive" : ""}
                />
                {validationErrors.name && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.name}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description" className="text-foreground">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  placeholder="Brief description of this configuration"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uid" className="text-foreground">UID *</Label>
                <Input
                  id="uid"
                  value={formData.uid}
                  onChange={(e) => updateFormData("uid", e.target.value)}
                  placeholder="e.g., UID-001"
                  className={validationErrors.uid ? "border-destructive" : ""}
                />
                {validationErrors.uid && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.uid}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ccsGen" className="text-foreground">CCS Generation *</Label>
                <Select value={formData.ccsGen} onValueChange={(v) => updateFormData("ccsGen", v)}>
                  <SelectTrigger className={validationErrors.ccsGen ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select generation" />
                  </SelectTrigger>
                  <SelectContent>
                    {ccsGenOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.ccsGen && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.ccsGen}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gateway" className="text-foreground">Gateway *</Label>
                <Select value={formData.gateway} onValueChange={(v) => updateFormData("gateway", v)}>
                  <SelectTrigger className={validationErrors.gateway ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    {gatewayOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.gateway && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.gateway}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signals" className="text-foreground">Signals (comma separated)</Label>
                <Input
                  id="signals"
                  value={formData.signals}
                  onChange={(e) => updateFormData("signals", e.target.value)}
                  placeholder="e.g., SIG_001, SIG_002"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appId" className="text-foreground">Application ID *</Label>
                <Input
                  id="appId"
                  value={formData.appId}
                  onChange={(e) => updateFormData("appId", e.target.value)}
                  placeholder="e.g., APP-ECU-001"
                  className={validationErrors.appId ? "border-destructive" : ""}
                />
                {validationErrors.appId && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.appId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="appVersion" className="text-foreground">Version *</Label>
                <Input
                  id="appVersion"
                  value={formData.appVersion}
                  onChange={(e) => updateFormData("appVersion", e.target.value)}
                  placeholder="e.g., 2.1.0"
                  className={validationErrors.appVersion ? "border-destructive" : ""}
                />
                {validationErrors.appVersion && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.appVersion}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="endpoint" className="text-foreground">API Endpoint *</Label>
                <Input
                  id="endpoint"
                  value={formData.endpoint}
                  onChange={(e) => updateFormData("endpoint", e.target.value)}
                  placeholder="e.g., /api/v1/ecu/update"
                  className={validationErrors.endpoint ? "border-destructive" : ""}
                />
                {validationErrors.endpoint && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.endpoint}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="parameters" className="text-foreground">Parameters (key=value, comma separated)</Label>
                <Input
                  id="parameters"
                  value={formData.parameters}
                  onChange={(e) => updateFormData("parameters", e.target.value)}
                  placeholder="e.g., mode=full, verify=true"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleModel" className="text-foreground">Vehicle Model *</Label>
                <Select value={formData.vehicleModel} onValueChange={(v) => updateFormData("vehicleModel", v)}>
                  <SelectTrigger className={validationErrors.vehicleModel ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleModels.map((model) => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.vehicleModel && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.vehicleModel}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year" className="text-foreground">Year *</Label>
                <Select value={formData.year} onValueChange={(v) => updateFormData("year", v)}>
                  <SelectTrigger className={validationErrors.year ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {["2024", "2025", "2026"].map((yr) => (
                      <SelectItem key={yr} value={yr}>{yr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.year && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.year}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin" className="text-foreground">VIN Pattern</Label>
                <Input
                  id="vin"
                  value={formData.vin}
                  onChange={(e) => updateFormData("vin", e.target.value)}
                  placeholder="e.g., 1N4BL4BV*NC******"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ecuType" className="text-foreground">ECU Type *</Label>
                <Select value={formData.ecuType} onValueChange={(v) => updateFormData("ecuType", v)}>
                  <SelectTrigger className={validationErrors.ecuType ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select ECU type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ecuTypes.map((ecu) => (
                      <SelectItem key={ecu} value={ecu}>{ecu}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.ecuType && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.ecuType}
                  </p>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeout" className="text-foreground">Timeout (ms) *</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => updateFormData("timeout", e.target.value)}
                  placeholder="e.g., 30000"
                  className={validationErrors.timeout ? "border-destructive" : ""}
                />
                {validationErrors.timeout && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.timeout}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="retryCount" className="text-foreground">Retry Count</Label>
                <Input
                  id="retryCount"
                  type="number"
                  value={formData.retryCount}
                  onChange={(e) => updateFormData("retryCount", e.target.value)}
                  placeholder="e.g., 3"
                  min="0"
                  max="10"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="acknowledgmentType" className="text-foreground">Acknowledgment Type *</Label>
                <Select value={formData.acknowledgmentType} onValueChange={(v) => updateFormData("acknowledgmentType", v)}>
                  <SelectTrigger className={validationErrors.acknowledgmentType ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select ACK type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ackTypes.map((ack) => (
                      <SelectItem key={ack} value={ack}>{ack}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.acknowledgmentType && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.acknowledgmentType}
                  </p>
                )}
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="successCriteria" className="text-foreground">Success Criteria *</Label>
                <Input
                  id="successCriteria"
                  value={formData.successCriteria}
                  onChange={(e) => updateFormData("successCriteria", e.target.value)}
                  placeholder="e.g., STATUS_OK"
                  className={validationErrors.successCriteria ? "border-destructive" : ""}
                />
                {validationErrors.successCriteria && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.successCriteria}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="errorHandling" className="text-foreground">Error Handling *</Label>
                <Select value={formData.errorHandling} onValueChange={(v) => updateFormData("errorHandling", v)}>
                  <SelectTrigger className={validationErrors.errorHandling ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select error handling" />
                  </SelectTrigger>
                  <SelectContent>
                    {errorHandlingOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.errorHandling && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.errorHandling}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="loggingLevel" className="text-foreground">Logging Level *</Label>
                <Select value={formData.loggingLevel} onValueChange={(v) => updateFormData("loggingLevel", v)}>
                  <SelectTrigger className={validationErrors.loggingLevel ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select logging level" />
                  </SelectTrigger>
                  <SelectContent>
                    {loggingLevels.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.loggingLevel && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.loggingLevel}
                  </p>
                )}
              </div>
            </div>

            {/* JSON Preview */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-foreground">JSON Preview</h4>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Valid</Badge>
              </div>
              <pre className="text-xs text-muted-foreground overflow-auto max-h-32">
                {JSON.stringify(buildConfiguration("draft"), null, 2)}
              </pre>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {editConfig ? "Edit Configuration" : "Create New Configuration"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete all steps to create a command configuration
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>

      {/* Step Progress */}
      <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step.id)}
              className="flex items-center gap-3"
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep > step.id
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p
                  className={cn(
                    "text-sm font-medium",
                    currentStep === step.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.name}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "hidden md:block w-12 lg:w-20 h-0.5 mx-2",
                  currentStep > step.id ? "bg-green-500" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Validation Bar */}
      <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
        <div className={cn(
          "h-2 w-2 rounded-full",
          Object.keys(validationErrors).length === 0 ? "bg-green-500" : "bg-yellow-500"
        )} />
        <span className="text-sm text-muted-foreground">
          JSON Validations / UI Validations
        </span>
        <Badge variant="secondary" className="ml-auto">
          Step {currentStep} of 5
        </Badge>
      </div>

      {/* Form Content */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            {(() => {
              const StepIcon = steps[currentStep - 1].icon
              return <StepIcon className="h-5 w-5" />
            })()}
            {steps[currentStep - 1].name}
          </CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>

          {currentStep < 5 ? (
            <Button onClick={handleNext} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="h-4 w-4 mr-2" />
              Submit for Approval
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
