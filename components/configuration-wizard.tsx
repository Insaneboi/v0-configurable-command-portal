"use client"

import { useState, useRef, useEffect } from "react"
import {
  useConfig,
  type Configuration,
  type KeyValuePair,
  type OperationResultEntry,
  BACKEND_CCSGEN_OPTIONS,
  BACKEND_UID_BY_CCSGEN,
  GATEWAY_OPTIONS,
} from "@/lib/config-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Plus,
  Trash2,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"

interface VehicleMapping {
  appKey: string
  appValue: string
  appType: KeyValuePair["type"]
  vehicleKey: string
  vehicleValue: string
}

function buildInitialMappings(
  editConfig: Configuration | null | undefined,
  appKeyValues: KeyValuePair[]
): VehicleMapping[] {
  const existingAttrs = editConfig?.vehiclePayload?.attributes || []
  return appKeyValues
    .filter((kv) => kv.key.trim())
    .map((kv) => {
      const appValue = kv.type === "range" ? `${kv.rangeMin || ""}-${kv.rangeMax || ""}` : kv.value
      const existing = existingAttrs.find((a) => a.key === kv.key)
      return {
        appKey: kv.key,
        appValue,
        appType: kv.type,
        vehicleKey: existing?.key ?? kv.key,
        vehicleValue: existing?.value ?? appValue,
      }
    })
}

interface ConfigWizardProps {
  editConfig?: Configuration | null
  onClose: () => void
}

const steps = [
  { id: 1, name: "Service Details", icon: Settings, description: "Service Name, CCSGen, UID, Gateway, Action Type" },
  { id: 2, name: "Application Payload", icon: Smartphone, description: "Key-Value Configuration" },
  { id: 3, name: "Vehicle Payload", icon: Car, description: "DCM Version, Attributes" },
  { id: 4, name: "ACK Configuration", icon: Bell, description: "Acknowledgement & Error Signals" },
  { id: 5, name: "Operation Result", icon: Activity, description: "Operation Result Entries" },
]

// Multi-select dropdown component
function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder,
  error,
}: {
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder: string
  error?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusIndex, setFocusIndex] = useState(-1)
  const listRef = useRef<HTMLDivElement>(null)

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault()
        setIsOpen(true)
        setFocusIndex(0)
      }
      return
    }
    switch (e.key) {
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        setFocusIndex(-1)
        break
      case "ArrowDown":
        e.preventDefault()
        setFocusIndex((prev) => Math.min(prev + 1, options.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setFocusIndex((prev) => Math.max(prev - 1, 0))
        break
      case "Enter":
      case " ":
        e.preventDefault()
        if (focusIndex >= 0 && focusIndex < options.length) {
          toggleOption(options[focusIndex])
        }
        break
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setFocusIndex(-1) }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 text-sm shadow-xs ring-offset-background cursor-pointer",
          error ? "border-destructive" : "border-input",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
      >
        <span className={cn("truncate", selected.length === 0 ? "text-muted-foreground" : "text-foreground")}>
          {selected.length === 0 ? placeholder : selected.join(", ")}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setFocusIndex(-1) }} />
          <div
            ref={listRef}
            role="listbox"
            aria-multiselectable="true"
            className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-md max-h-60 overflow-y-auto"
            onKeyDown={handleKeyDown}
          >
            {options.map((option, index) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected.includes(option)}
                onClick={() => toggleOption(option)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                  index === focusIndex && "bg-accent text-accent-foreground"
                )}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded border flex items-center justify-center",
                    selected.includes(option)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-input"
                  )}
                >
                  {selected.includes(option) && <Check className="h-3 w-3" />}
                </div>
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Shared type options and validation for key-value editors
const KV_TYPE_OPTIONS: { value: KeyValuePair["type"]; label: string }[] = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "float", label: "Float" },
  { value: "boolean", label: "Boolean" },
  { value: "range", label: "Range" },
]

/** Validates a value field against its type. Returns an error message or null.
 *  If `block` is true in the return, the input should be rejected entirely. */
function validateTypedValue(
  type: KeyValuePair["type"],
  field: string,
  val: string
): { error: string | null; block: boolean } {
  if (type === "string") {
    if (/^\d+(\.\d+)?$/.test(val.trim()) && val.trim() !== "") {
      return { error: "String type cannot be a purely numeric value", block: false }
    }
  } else if (type === "number") {
    if (val !== "" && !/^-?\d*$/.test(val)) {
      return { error: "Only whole numbers are allowed", block: true }
    }
  } else if (type === "float" || (type === "range" && (field === "rangeMin" || field === "rangeMax"))) {
    if (val !== "" && val !== "-" && !/^-?\d*\.?\d*$/.test(val)) {
      return { error: "Only numeric values are allowed", block: true }
    }
  }
  return { error: null, block: false }
}

// Key-Value editor component
function KeyValueEditor({
  pairs,
  onChange,
  keyLabel = "Key",
  valueLabel = "Value",
  showType = false,
}: {
  pairs: KeyValuePair[]
  onChange: (pairs: KeyValuePair[]) => void
  keyLabel?: string
  valueLabel?: string
  showType?: boolean
}) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const addPair = () => {
    onChange([...pairs, { key: "", type: "string", value: "" }])
  }

  const updatePair = (index: number, field: "key" | "value" | "rangeMin" | "rangeMax", val: string) => {
    if (showType && (field === "value" || field === "rangeMin" || field === "rangeMax")) {
      const pair = pairs[index]
      const errorKey = `${index}-${field}`
      const { error, block } = validateTypedValue(pair.type, field, val)
      if (block) {
        setFieldErrors((prev) => ({ ...prev, [errorKey]: error! }))
        return
      }
      if (error) {
        setFieldErrors((prev) => ({ ...prev, [errorKey]: error }))
      } else {
        setFieldErrors((prev) => { const u = { ...prev }; delete u[errorKey]; return u })
      }
    }
    const updated = [...pairs]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  const updateType = (index: number, type: KeyValuePair["type"]) => {
    const updated = [...pairs]
    if (type === "boolean") {
      updated[index] = { ...updated[index], type, value: "true", rangeMin: undefined, rangeMax: undefined }
    } else if (type === "range") {
      updated[index] = { ...updated[index], type, value: "", rangeMin: "", rangeMax: "" }
    } else {
      updated[index] = { ...updated[index], type, value: "", rangeMin: undefined, rangeMax: undefined }
    }
    setFieldErrors((prev) => {
      const u = { ...prev }
      delete u[`${index}-value`]
      delete u[`${index}-rangeMin`]
      delete u[`${index}-rangeMax`]
      return u
    })
    onChange(updated)
  }

  const renderValueInput = (pair: KeyValuePair, index: number) => {
    const valueError = fieldErrors[`${index}-value`]
    const rangeMinError = fieldErrors[`${index}-rangeMin`]
    const rangeMaxError = fieldErrors[`${index}-rangeMax`]

    const errorMsg = (err: string | undefined) => err ? <p className="text-xs mt-0.5 text-destructive">{err}</p> : null

    if (!showType) {
      return (
        <Input
          value={pair.value}
          onChange={(e) => updatePair(index, "value", e.target.value)}
          placeholder={`${valueLabel}...`}
          className="h-8 text-sm"
        />
      )
    }
    if (pair.type === "boolean") {
      return (
        <Select value={pair.value || "true"} onValueChange={(v) => updatePair(index, "value", v)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      )
    }
    if (pair.type === "range") {
      return (
        <div>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <Input
                value={pair.rangeMin || ""}
                onChange={(e) => updatePair(index, "rangeMin", e.target.value)}
                placeholder="Min"
                className={cn("h-8 text-sm", rangeMinError && "border-destructive")}
              />
              {errorMsg(rangeMinError)}
            </div>
            <span className="text-muted-foreground text-xs">to</span>
            <div className="flex-1">
              <Input
                value={pair.rangeMax || ""}
                onChange={(e) => updatePair(index, "rangeMax", e.target.value)}
                placeholder="Max"
                className={cn("h-8 text-sm", rangeMaxError && "border-destructive")}
              />
              {errorMsg(rangeMaxError)}
            </div>
          </div>
        </div>
      )
    }
    return (
      <div>
        <Input
          value={pair.value}
          onChange={(e) => updatePair(index, "value", e.target.value)}
          placeholder={pair.type === "number" ? "Enter a whole number..." : pair.type === "float" ? "Enter a decimal number..." : `${valueLabel}...`}
          className={cn("h-8 text-sm", valueError && "border-destructive")}
        />
        {errorMsg(valueError)}
      </div>
    )
  }

  const removePair = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {pairs.map((pair, index) => (
          <div key={index} className="border border-border rounded-lg p-3 space-y-2 relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer absolute top-2 right-2"
              title="Remove this entry"
              onClick={() => removePair(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div>
              <Label className="text-xs font-semibold">{keyLabel}</Label>
              <Input
                value={pair.key}
                onChange={(e) => updatePair(index, "key", e.target.value)}
                placeholder={`${keyLabel}...`}
                className="h-8 text-sm"
              />
            </div>
            {showType && (
              <div>
                <Label className="text-xs font-semibold">Type</Label>
                <Select value={pair.type || "string"} onValueChange={(v) => updateType(index, v as KeyValuePair["type"])}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KV_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold">{valueLabel}</Label>
              {renderValueInput(pair, index)}
            </div>
          </div>
        ))}
        {pairs.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            No entries yet. Click &quot;Add Entry&quot; to begin.
          </p>
        )}
      </div>

      {/* Desktop table layout */}
      <div className="hidden md:block border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left text-xs font-semibold text-foreground px-3 py-2">{keyLabel}</th>
              {showType && <th className="text-left text-xs font-semibold text-foreground px-3 py-2">Type</th>}
              <th className="text-left text-xs font-semibold text-foreground px-3 py-2">{valueLabel}</th>
              <th className="w-10 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair, index) => (
              <tr key={index} className="border-t border-border">
                <td className="px-3 py-2">
                  <Input
                    value={pair.key}
                    onChange={(e) => updatePair(index, "key", e.target.value)}
                    placeholder={`${keyLabel}...`}
                    className="h-8 text-sm"
                  />
                </td>
                {showType && (
                  <td className="px-3 py-2">
                    <Select value={pair.type || "string"} onValueChange={(v) => updateType(index, v as KeyValuePair["type"])}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KV_TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                )}
                <td className="px-3 py-2">
                  {renderValueInput(pair, index)}
                </td>
                <td className="px-3 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                    title="Remove this entry"
                    onClick={() => removePair(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {pairs.length === 0 && (
              <tr>
                <td colSpan={showType ? 4 : 3} className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No entries yet. Click &quot;Add Entry&quot; to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" onClick={addPair} title="Add a new key-value entry" className="cursor-pointer">
        <Plus className="h-4 w-4 mr-1" />
        Add Entry
      </Button>
    </div>
  )
}

// Application Payload editor with Type column
function AppPayloadEditor({
  pairs,
  onChange,
  showValidation,
}: {
  pairs: KeyValuePair[]
  onChange: (pairs: KeyValuePair[]) => void
  showValidation?: boolean
}) {
  const addPair = () => {
    onChange([...pairs, { key: "", type: "string", value: "" }])
  }

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const updateField = (index: number, field: string, val: string) => {
    const pair = pairs[index]
    const errorKey = `${index}-${field}`

    if (field === "value" || field === "rangeMin" || field === "rangeMax") {
      const { error, block } = validateTypedValue(pair.type, field, val)
      if (block) {
        setFieldErrors((prev) => ({ ...prev, [errorKey]: error! }))
        return
      }
      if (error) {
        setFieldErrors((prev) => ({ ...prev, [errorKey]: error }))
      } else {
        setFieldErrors((prev) => { const u = { ...prev }; delete u[errorKey]; return u })
      }
    }

    const updated = [...pairs]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  const updateType = (index: number, newType: KeyValuePair["type"]) => {
    const updated = [...pairs]
    // Reset value fields when type changes
    updated[index] = {
      ...updated[index],
      type: newType,
      value: newType === "boolean" ? "true" : "",
      rangeMin: "",
      rangeMax: "",
    }
    // Clear any validation errors for this row
    setFieldErrors((prev) => {
      const u = { ...prev }
      delete u[`${index}-value`]
      delete u[`${index}-rangeMin`]
      delete u[`${index}-rangeMax`]
      return u
    })
    onChange(updated)
  }

  const removePair = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index))
  }

  const renderValueCell = (pair: KeyValuePair, index: number) => {
    const valueError = fieldErrors[`${index}-value`]
    const rangeMinError = fieldErrors[`${index}-rangeMin`]
    const rangeMaxError = fieldErrors[`${index}-rangeMax`]
    const emptyValue = showValidation && !pair.value.trim()
    const emptyMin = showValidation && !(pair.rangeMin || "").trim()
    const emptyMax = showValidation && !(pair.rangeMax || "").trim()

    // Error message — shown in a fixed-height slot below the input
    const errorMsg = (error: string | undefined, empty: boolean) => {
      const text = error || (empty ? "Required" : "")
      return <p className={cn("text-xs mt-0.5 h-4 leading-4", text ? "text-destructive" : "text-transparent")}>{text || "\u00A0"}</p>
    }

    switch (pair.type) {
      case "boolean":
        return (
          <div>
            <Select value={pair.value || "true"} onValueChange={(v) => updateField(index, "value", v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
            {errorMsg(undefined, false)}
          </div>
        )
      case "range":
        return (
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                inputMode="decimal"
                value={pair.rangeMin || ""}
                onChange={(e) => updateField(index, "rangeMin", e.target.value)}
                placeholder="Min"
                className={cn("h-8 text-sm", (rangeMinError || emptyMin) && "border-destructive")}
              />
              {errorMsg(rangeMinError, emptyMin)}
            </div>
            <div className="flex-1">
              <Input
                inputMode="decimal"
                value={pair.rangeMax || ""}
                onChange={(e) => updateField(index, "rangeMax", e.target.value)}
                placeholder="Max"
                className={cn("h-8 text-sm", (rangeMaxError || emptyMax) && "border-destructive")}
              />
              {errorMsg(rangeMaxError, emptyMax)}
            </div>
          </div>
        )
      case "number":
        return (
          <div>
            <Input
              inputMode="numeric"
              value={pair.value}
              onChange={(e) => updateField(index, "value", e.target.value)}
              placeholder="Whole number..."
              className={cn("h-8 text-sm", (valueError || emptyValue) && "border-destructive")}
            />
            {errorMsg(valueError, emptyValue)}
          </div>
        )
      case "float":
        return (
          <div>
            <Input
              inputMode="decimal"
              value={pair.value}
              onChange={(e) => updateField(index, "value", e.target.value)}
              placeholder="Decimal number..."
              className={cn("h-8 text-sm", (valueError || emptyValue) && "border-destructive")}
            />
            {errorMsg(valueError, emptyValue)}
          </div>
        )
      default: // string
        return (
          <div>
            <Input
              value={pair.value}
              onChange={(e) => updateField(index, "value", e.target.value)}
              placeholder="Text value..."
              className={cn("h-8 text-sm", (valueError || emptyValue) && "border-destructive")}
            />
            {errorMsg(valueError, emptyValue)}
          </div>
        )
    }
  }

  return (
    <div className="space-y-3">
      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {pairs.map((pair, index) => (
          <div key={index} className="border border-border rounded-lg p-3 space-y-2 relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer absolute top-2 right-2"
              title="Remove this entry"
              onClick={() => removePair(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div>
              <Label className="text-xs font-semibold">Parameter Key</Label>
              <Input
                value={pair.key}
                onChange={(e) => updateField(index, "key", e.target.value)}
                placeholder="Parameter Key..."
                className={cn("h-8 text-sm", showValidation && !pair.key.trim() && "border-destructive")}
              />
              {showValidation && !pair.key.trim() && (
                <p className="text-xs mt-0.5 text-destructive">Required</p>
              )}
            </div>
            <div>
              <Label className="text-xs font-semibold">Type</Label>
              <Select value={pair.type || "string"} onValueChange={(v) => updateType(index, v as KeyValuePair["type"])}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KV_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Parameter Value</Label>
              {renderValueCell(pair, index)}
            </div>
          </div>
        ))}
        {pairs.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            No entries yet. Click &quot;Add Entry&quot; to begin.
          </p>
        )}
      </div>

      {/* Desktop table layout */}
      <div className="hidden md:block border border-border rounded-lg overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: "30%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "42%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left text-xs font-semibold text-foreground px-3 py-2">Parameter Key</th>
              <th className="text-left text-xs font-semibold text-foreground px-3 py-2">Type</th>
              <th className="text-left text-xs font-semibold text-foreground px-3 py-2">Parameter Value</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair, index) => (
              <tr key={index} className="border-t border-border align-top">
                <td className="px-3 py-2">
                  <div>
                    <Input
                      value={pair.key}
                      onChange={(e) => updateField(index, "key", e.target.value)}
                      placeholder="Parameter Key..."
                      className={cn("h-8 text-sm", showValidation && !pair.key.trim() && "border-destructive")}
                    />
                    <p className={cn("text-xs mt-0.5 h-4 leading-4", showValidation && !pair.key.trim() ? "text-destructive" : "text-transparent")}>{showValidation && !pair.key.trim() ? "Required" : "\u00A0"}</p>
                  </div>
                </td>
                <td className="px-3 py-2 align-top">
                  <div>
                    <Select value={pair.type || "string"} onValueChange={(v) => updateType(index, v as KeyValuePair["type"])}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KV_TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs mt-0.5 h-4 leading-4 text-transparent">{"\u00A0"}</p>
                  </div>
                </td>
                <td className="px-3 py-2 align-top">
                  {renderValueCell(pair, index)}
                </td>
                <td className="px-3 py-2 align-top">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                    title="Remove this entry"
                    onClick={() => removePair(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {pairs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No entries yet. Click &quot;Add Entry&quot; to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" onClick={addPair} title="Add a new key-value entry" className="cursor-pointer">
        <Plus className="h-4 w-4 mr-1" />
        Add Entry
      </Button>
    </div>
  )
}

export function ConfigurationWizard({ editConfig, onClose }: ConfigWizardProps) {
  const { saveConfiguration, submitForApproval } = useConfig()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})


  // Step 1: Service Details
  const [serviceName, setServiceName] = useState(editConfig?.serviceDetails?.serviceName || "")
  const [description, setDescription] = useState(editConfig?.description || "")
  const [ccsGen, setCcsGen] = useState(editConfig?.serviceDetails?.ccsGen || BACKEND_CCSGEN_OPTIONS[0])
  const [selectedUids, setSelectedUids] = useState<string[]>(editConfig?.serviceDetails?.uid || [])
  const [selectedGateway, setSelectedGateway] = useState(editConfig?.serviceDetails?.gateway || "")
  const [actionType, setActionType] = useState(editConfig?.serviceDetails?.actionType || "")
  const [ucdRefreshApplicable, setUcdRefreshApplicable] = useState(editConfig?.serviceDetails?.ucdRefreshApplicable ?? false)
  const [aiviSyncApplicable, setAiviSyncApplicable] = useState(editConfig?.serviceDetails?.aiviSyncApplicable ?? false)
  const [svtCheck, setSvtCheck] = useState(editConfig?.serviceDetails?.svtCheck ?? false)
  const [privacyCheck, setPrivacyCheck] = useState(editConfig?.serviceDetails?.privacyCheck ?? false)
  const [ownershipCheck, setOwnershipCheck] = useState(editConfig?.serviceDetails?.ownershipCheck ?? false)

  // Step 2: Application Payload
  const [appKeyValues, setAppKeyValues] = useState<KeyValuePair[]>(
    editConfig?.applicationPayload?.keyValues || [{ key: "", type: "string", value: "" }]
  )

  // Step 3: Vehicle Payload
  const [dcmVersion, setDcmVersion] = useState(editConfig?.vehiclePayload?.dcmVersion || "")
  const [targetId, setTargetId] = useState(editConfig?.vehiclePayload?.targetId || "")
  const [vehicleOnlyAttributes, setVehicleOnlyAttributes] = useState<KeyValuePair[]>(
    editConfig?.vehiclePayload?.vehicleAttributes || [{ key: "", type: "string", value: "" }]
  )
  const [vehicleMappings, setVehicleMappings] = useState<VehicleMapping[]>(() =>
    buildInitialMappings(editConfig, appKeyValues)
  )

  // Sync vehicle mappings when appKeyValues change
  useEffect(() => {
    setVehicleMappings((prev) => {
      const activeAppKeys = appKeyValues.filter((kv) => kv.key.trim())
      const newMappings: VehicleMapping[] = activeAppKeys.map((kv) => {
        const appValue = kv.type === "range" ? `${kv.rangeMin || ""}-${kv.rangeMax || ""}` : kv.value
        const existing = prev.find((m) => m.appKey === kv.key)
        if (existing) {
          const isString = kv.type === "string"
          return {
            appKey: kv.key,
            appValue,
            appType: kv.type,
            vehicleKey: existing.vehicleKey,
            vehicleValue: isString ? existing.vehicleValue : appValue,
          }
        }
        return {
          appKey: kv.key,
          appValue,
          appType: kv.type,
          vehicleKey: kv.key,
          vehicleValue: appValue,
        }
      })
      return newMappings
    })
  }, [appKeyValues])

  // Step 4: ACK Configuration
  const [ackSignal, setAckSignal] = useState(editConfig?.ackConfig?.ackSignal || "")
  const [errorSignal, setErrorSignal] = useState(editConfig?.ackConfig?.errorSignal || "")

  // Step 5: Operation Result
  const [judgementSignals, setJudgementSignals] = useState<string[]>(
    editConfig?.operationResult?.judgementSignals || []
  )
  const [judgementInput, setJudgementInput] = useState("")
  const [operationResults, setOperationResults] = useState<OperationResultEntry[]>(
    editConfig?.operationResult?.results || [{ resultKey: "", resultValue: "" }]
  )

  // Available UIDs based on selected CCSGen
  const availableUids = BACKEND_UID_BY_CCSGEN[ccsGen] || []

  const handleCcsGenChange = (value: string) => {
    setCcsGen(value)
    // Reset UIDs when CCSGen changes since options depend on it
    setSelectedUids([])
  }

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    if (step === 1) {
      if (!serviceName) errors.serviceName = "Service name is required"
      if (!ccsGen) errors.ccsGen = "CCSGen is required"
      if (selectedUids.length === 0) errors.uid = "At least one UID is required"
      if (!selectedGateway) errors.gateway = "Gateway is required"
      if (!actionType) errors.actionType = "Action type is required"
    } else if (step === 2) {
      if (appKeyValues.length === 0) {
        errors.appKeyValues = "At least one entry is required"
      } else {
        let hasIncomplete = false
        for (const p of appKeyValues) {
          if (!p.key.trim()) { hasIncomplete = true }
          if (p.type === "range") {
            if (!(p.rangeMin || "").trim() || !(p.rangeMax || "").trim()) { hasIncomplete = true }
          } else if (p.type !== "boolean") {
            if (!p.value.trim()) { hasIncomplete = true }
          }
        }
        if (hasIncomplete) errors.appKeyValues = "All fields are required for every entry"
      }
    } else if (step === 3) {
      if (!dcmVersion) errors.dcmVersion = "DCM Version is required"
      if (!targetId) errors.targetId = "Target ID is required"
    } else if (step === 4) {
      if (!ackSignal) errors.ackSignal = "Acknowledgement signal is required"
      if (!errorSignal) errors.errorSignal = "Error signal is required"
    } else if (step === 5) {
      const validResults = operationResults.filter((r) => r.resultKey.trim() && r.resultValue.trim())
      if (validResults.length === 0) errors.operationResults = "At least one result entry is required"
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

  // Build separate JSON for each page
  const buildServiceDetailsJson = () => ({
    serviceName,
    ccsGen,
    uid: selectedUids,
    gateway: selectedGateway,
    actionType,
    ucdRefreshApplicable,
    aiviSyncApplicable,
    svtCheck,
    privacyCheck,
    ownershipCheck,
  })

  const buildApplicationPayloadJson = () => ({
    actionType,
    keyValues: appKeyValues
      .filter((p) => p.key.trim() && (p.type === "range" ? (p.rangeMin?.trim() || p.rangeMax?.trim()) : p.value.trim()))
      .map((p) => {
        if (p.type === "range") {
          return { key: p.key, type: p.type, rangeMin: p.rangeMin, rangeMax: p.rangeMax }
        }
        return { key: p.key, type: p.type, value: p.value }
      }),
  })

  const buildVehiclePayloadJson = () => ({
    dcmVersion,
    targetId,
    attributes: vehicleMappings
      .filter((m) => m.vehicleKey.trim() && m.vehicleValue.trim())
      .map((m) => ({ appKey: m.appKey, key: m.vehicleKey, type: m.appType, value: m.vehicleValue })),
    vehicleAttributes: vehicleOnlyAttributes.filter((p) => p.key.trim() && (p.type === "range" ? (p.rangeMin?.trim() || p.rangeMax?.trim()) : p.value.trim())),
  })

  const buildAckConfigJson = () => ({
    dcmVersion,
    targetId,
    ackSignal,
    errorSignal,
  })

  const buildOperationResultJson = () => ({
    dcmVersion,
    targetId,
    judgementSignals,
    results: operationResults.filter((r) => r.resultKey.trim() && r.resultValue.trim()),
  })

  const buildConfiguration = (status: Configuration["status"]): Configuration => {
    return {
      id: editConfig?.id || Date.now().toString(),
      name: serviceName,
      description,
      status,
      createdAt: editConfig?.createdAt || new Date(),
      updatedAt: new Date(),
      createdBy: editConfig?.createdBy || user?.email || "",
      serviceDetails: buildServiceDetailsJson(),
      applicationPayload: {
        keyValues: appKeyValues
          .filter((p) => p.key.trim() && (p.type === "range" ? (p.rangeMin?.trim() || p.rangeMax?.trim()) : p.value.trim()))
          .map((p) => {
            if (p.type === "range") {
              return { key: p.key, type: p.type, value: "", rangeMin: p.rangeMin, rangeMax: p.rangeMax }
            }
            return { key: p.key, type: p.type, value: p.value }
          }),
      },
      vehiclePayload: buildVehiclePayloadJson(),
      ackConfig: buildAckConfigJson(),
      operationResult: buildOperationResultJson(),
    }
  }

  const getStepJson = () => {
    switch (currentStep) {
      case 1: return buildServiceDetailsJson()
      case 2: return buildApplicationPayloadJson()
      case 3: return buildVehiclePayloadJson()
      case 4: return buildAckConfigJson()
      case 5: return buildOperationResultJson()
      default: return {}
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

  const addOperationResult = () => {
    setOperationResults([...operationResults, { resultKey: "", resultValue: "" }])
  }

  const updateOperationResult = (index: number, field: "resultKey" | "resultValue", value: string) => {
    const updated = [...operationResults]
    updated[index] = { ...updated[index], [field]: value }
    setOperationResults(updated)
  }

  const removeOperationResult = (index: number) => {
    setOperationResults(operationResults.filter((_, i) => i !== index))
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceName" className="text-foreground">Service Name *</Label>
                <Input
                  id="serviceName"
                  value={serviceName}
                  onChange={(e) => {
                    setServiceName(e.target.value)
                    if (validationErrors.serviceName) {
                      setValidationErrors((prev) => { const u = { ...prev }; delete u.serviceName; return u })
                    }
                  }}
                  placeholder="e.g., ECU Firmware Update"
                  className={validationErrors.serviceName ? "border-destructive" : ""}
                />
                {validationErrors.serviceName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.serviceName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this service"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ccsGen" className="text-foreground">CCSGen *</Label>
                <Select value={ccsGen} onValueChange={handleCcsGenChange}>
                  <SelectTrigger className={validationErrors.ccsGen ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select generation" />
                  </SelectTrigger>
                  <SelectContent>
                    {BACKEND_CCSGEN_OPTIONS.map((opt) => (
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
                <Label className="text-foreground">UID * (Multi-select)</Label>
                <MultiSelectDropdown
                  options={availableUids}
                  selected={selectedUids}
                  onChange={(vals) => {
                    setSelectedUids(vals)
                    if (validationErrors.uid) {
                      setValidationErrors((prev) => { const u = { ...prev }; delete u.uid; return u })
                    }
                  }}
                  placeholder="Select UIDs based on CCSGen"
                  error={!!validationErrors.uid}
                />
                {validationErrors.uid && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.uid}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Gateway *</Label>
                <Select value={selectedGateway} onValueChange={(v) => {
                  setSelectedGateway(v)
                  if (validationErrors.gateway) {
                    setValidationErrors((prev) => { const u = { ...prev }; delete u.gateway; return u })
                  }
                }}>
                  <SelectTrigger className={validationErrors.gateway ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    {GATEWAY_OPTIONS.map((opt) => (
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
                <Label htmlFor="actionType" className="text-foreground">Action Type *</Label>
                <Input
                  id="actionType"
                  value={actionType}
                  onChange={(e) => {
                    setActionType(e.target.value)
                    if (validationErrors.actionType) {
                      setValidationErrors((prev) => { const u = { ...prev }; delete u.actionType; return u })
                    }
                  }}
                  placeholder="e.g., firmware_update"
                  className={validationErrors.actionType ? "border-destructive" : ""}
                />
                {validationErrors.actionType && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.actionType}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2 pt-2">
                <Label className="text-foreground">Service Checks</Label>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                  {[
                    { id: "ucdRefreshApplicable", label: "UCD Refresh Applicable", value: ucdRefreshApplicable, setter: setUcdRefreshApplicable },
                    { id: "aiviSyncApplicable", label: "AIVI SYNC Applicable", value: aiviSyncApplicable, setter: setAiviSyncApplicable },
                    { id: "svtCheck", label: "SVT Check", value: svtCheck, setter: setSvtCheck },
                    { id: "privacyCheck", label: "Privacy Check", value: privacyCheck, setter: setPrivacyCheck },
                    { id: "ownershipCheck", label: "Ownership Check", value: ownershipCheck, setter: setOwnershipCheck },
                  ].map((item) => (
                    <label key={item.id} htmlFor={item.id} title={`Toggle ${item.label}`} className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        id={item.id}
                        checked={item.value}
                        onChange={(e) => item.setter(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-input accent-primary"
                      />
                      <span className="text-foreground">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Application Payload Key-Value Configuration *</Label>
              <p className="text-sm text-muted-foreground">
                Configure all application inputs for the selected action type: <strong>{actionType || "—"}</strong>
              </p>
              {validationErrors.appKeyValues && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {validationErrors.appKeyValues}
                </p>
              )}
            </div>

            <AppPayloadEditor
              pairs={appKeyValues}
              onChange={setAppKeyValues}
              showValidation={!!validationErrors.appKeyValues}
            />

          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dcmVersion" className="text-foreground">DCM Version *</Label>
                <Input
                  id="dcmVersion"
                  value={dcmVersion}
                  onChange={(e) => {
                    setDcmVersion(e.target.value)
                    if (validationErrors.dcmVersion) {
                      setValidationErrors((prev) => { const u = { ...prev }; delete u.dcmVersion; return u })
                    }
                  }}
                  placeholder="e.g., DCM-3.2.1"
                  className={validationErrors.dcmVersion ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  This value will be non-editable in all subsequent pages.
                </p>
                {validationErrors.dcmVersion && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.dcmVersion}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetId" className="text-foreground">Target ID *</Label>
                <Input
                  id="targetId"
                  value={targetId}
                  onChange={(e) => {
                    setTargetId(e.target.value)
                    if (validationErrors.targetId) {
                      setValidationErrors((prev) => { const u = { ...prev }; delete u.targetId; return u })
                    }
                  }}
                  placeholder="e.g., TGT-001"
                  className={validationErrors.targetId ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  This value will be non-editable in all subsequent pages.
                </p>
                {validationErrors.targetId && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.targetId}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Vehicle Payload Mappings</Label>
              <p className="text-xs text-muted-foreground">Auto-populated from Application Payload entries</p>

              {vehicleMappings.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No application payload entries. Go to Step 2 to add entries.
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="space-y-3 md:hidden">
                    {vehicleMappings.map((mapping, index) => (
                      <div key={index} className="rounded-md border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">App Key</span>
                          <Badge variant="secondary" className="text-xs">{mapping.appType}</Badge>
                        </div>
                        <p className="text-sm font-medium">{mapping.appKey}</p>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">App Value</Label>
                          <p className="text-sm text-muted-foreground">{mapping.appValue || "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Vehicle Key</Label>
                          <Input
                            value={mapping.vehicleKey}
                            onChange={(e) => {
                              const updated = [...vehicleMappings]
                              updated[index] = { ...updated[index], vehicleKey: e.target.value }
                              setVehicleMappings(updated)
                            }}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Vehicle Value</Label>
                          <Input
                            value={mapping.vehicleValue}
                            onChange={(e) => {
                              const updated = [...vehicleMappings]
                              updated[index] = { ...updated[index], vehicleValue: e.target.value }
                              setVehicleMappings(updated)
                            }}
                            disabled={mapping.appType !== "string"}
                            className={cn("h-8 text-sm", mapping.appType !== "string" && "bg-muted text-muted-foreground cursor-not-allowed")}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">App Key</th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">App Value</th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Vehicle Key</th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Vehicle Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicleMappings.map((mapping, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="px-3 py-2 text-muted-foreground">{mapping.appKey}</td>
                            <td className="px-3 py-2">
                              <Badge variant="secondary" className="text-xs">{mapping.appType}</Badge>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{mapping.appValue || "—"}</td>
                            <td className="px-3 py-2">
                              <Input
                                value={mapping.vehicleKey}
                                onChange={(e) => {
                                  const updated = [...vehicleMappings]
                                  updated[index] = { ...updated[index], vehicleKey: e.target.value }
                                  setVehicleMappings(updated)
                                }}
                                className="h-8 text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={mapping.vehicleValue}
                                onChange={(e) => {
                                  const updated = [...vehicleMappings]
                                  updated[index] = { ...updated[index], vehicleValue: e.target.value }
                                  setVehicleMappings(updated)
                                }}
                                disabled={mapping.appType !== "string"}
                                className={cn("h-8 text-sm", mapping.appType !== "string" && "bg-muted text-muted-foreground cursor-not-allowed")}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Vehicle-Only Attributes</Label>
              <p className="text-xs text-muted-foreground">Additional vehicle-specific attributes not mapped from Application Payload</p>
              <KeyValueEditor
                pairs={vehicleOnlyAttributes}
                onChange={setVehicleOnlyAttributes}
                keyLabel="Attribute"
                valueLabel="Value"
                showType
              />
            </div>

          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">DCM Version</Label>
                <Input
                  value={dcmVersion || "—"}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Inherited from Vehicle Payload page (non-editable)</p>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Target ID</Label>
                <Input
                  value={targetId || "—"}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Inherited from Vehicle Payload page (non-editable)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ackSignal" className="text-foreground">Acknowledgement Signal *</Label>
                <Input
                  id="ackSignal"
                  value={ackSignal}
                  onChange={(e) => {
                    setAckSignal(e.target.value)
                    if (validationErrors.ackSignal) {
                      setValidationErrors((prev) => { const u = { ...prev }; delete u.ackSignal; return u })
                    }
                  }}
                  placeholder="Enter acknowledgement signal..."
                  className={validationErrors.ackSignal ? "border-destructive" : ""}
                />
                {validationErrors.ackSignal && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.ackSignal}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="errorSignal" className="text-foreground">Error Signal *</Label>
                <Input
                  id="errorSignal"
                  value={errorSignal}
                  onChange={(e) => {
                    setErrorSignal(e.target.value)
                    if (validationErrors.errorSignal) {
                      setValidationErrors((prev) => { const u = { ...prev }; delete u.errorSignal; return u })
                    }
                  }}
                  placeholder="Enter error signal..."
                  className={validationErrors.errorSignal ? "border-destructive" : ""}
                />
                {validationErrors.errorSignal && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.errorSignal}
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
                <Label className="text-foreground">DCM Version</Label>
                <Input
                  value={dcmVersion || "—"}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Inherited from Vehicle Payload page (non-editable)</p>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Target ID</Label>
                <Input
                  value={targetId || "—"}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Inherited from Vehicle Payload page (non-editable)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="judgementSignal" className="text-foreground">Judgement Signals</Label>
              <p className="text-xs text-muted-foreground">Type a signal and press Enter to add</p>
              <div className="flex flex-wrap gap-2 min-h-[36px] rounded-md border border-input bg-background px-3 py-2">
                {judgementSignals.map((signal, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 pr-1">
                    {signal}
                    <button
                      type="button"
                      onClick={() => setJudgementSignals(judgementSignals.filter((_, i) => i !== index))}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  id="judgementSignal"
                  value={judgementInput}
                  onChange={(e) => setJudgementInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const val = judgementInput.trim()
                      if (val && !judgementSignals.includes(val)) {
                        setJudgementSignals([...judgementSignals, val])
                        setJudgementInput("")
                      }
                    } else if (e.key === "Backspace" && judgementInput === "" && judgementSignals.length > 0) {
                      setJudgementSignals(judgementSignals.slice(0, -1))
                    }
                  }}
                  placeholder={judgementSignals.length === 0 ? "e.g., SIG_OK" : "Add more..."}
                  className="h-7 min-w-[120px] flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Operation Results *</Label>
              <p className="text-sm text-muted-foreground">Add multiple result entries for this operation.</p>
              {validationErrors.operationResults && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {validationErrors.operationResults}
                </p>
              )}
            </div>

            {/* Mobile card layout */}
            <div className="space-y-3 md:hidden">
              {operationResults.map((result, index) => (
                <div key={index} className="border border-border rounded-lg p-3 space-y-2 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer absolute top-2 right-2"
                    title="Remove this result entry"
                    onClick={() => removeOperationResult(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div>
                    <Label className="text-xs font-semibold">Result Key</Label>
                    <Input
                      value={result.resultKey}
                      onChange={(e) => updateOperationResult(index, "resultKey", e.target.value)}
                      placeholder="e.g., status"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Result Value</Label>
                    <Input
                      value={result.resultValue}
                      onChange={(e) => updateOperationResult(index, "resultValue", e.target.value)}
                      placeholder="e.g., STATUS_OK"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              ))}
              {operationResults.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No result entries yet. Click &quot;Add Result&quot; to begin.
                </p>
              )}
            </div>

            {/* Desktop table layout */}
            <div className="hidden md:block border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left text-xs font-semibold text-foreground px-3 py-2">Result Key</th>
                    <th className="text-left text-xs font-semibold text-foreground px-3 py-2">Result Value</th>
                    <th className="w-10 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {operationResults.map((result, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="px-3 py-2">
                        <Input
                          value={result.resultKey}
                          onChange={(e) => updateOperationResult(index, "resultKey", e.target.value)}
                          placeholder="e.g., status"
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={result.resultValue}
                          onChange={(e) => updateOperationResult(index, "resultValue", e.target.value)}
                          placeholder="e.g., STATUS_OK"
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                          title="Remove this result entry"
                          onClick={() => removeOperationResult(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {operationResults.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No result entries yet. Click &quot;Add Result&quot; to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Button variant="outline" size="sm" onClick={addOperationResult} title="Add a new result entry" className="cursor-pointer">
              <Plus className="h-4 w-4 mr-1" />
              Add Result
            </Button>

          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-0 overflow-y-auto">
      {/* Header — fixed top */}
      <div className="shrink-0 flex items-center justify-between pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {editConfig ? "Edit Service" : "Create New Service"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Complete all steps to configure a new service
          </p>
        </div>
        <Button variant="outline" onClick={onClose} title="Cancel and return to configurations list" className="cursor-pointer">
          Cancel
        </Button>
      </div>

      {/* Step Progress — fixed */}
      <div className="shrink-0 bg-card border border-border rounded-lg p-3 px-4 sm:p-4 sm:px-6 mb-4">
        {/* Mobile compact stepper */}
        <div className="md:hidden flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{steps[currentStep - 1].name}</p>
            <p className="text-xs text-muted-foreground">Step {currentStep} of 5</p>
          </div>
          <button
            onClick={handleNext}
            disabled={currentStep === 5}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop circles + connectors row */}
        <div className="hidden md:flex items-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => setCurrentStep(step.id)}
                title={`Go to Step ${step.id}: ${step.name}`}
                className={cn(
                  "h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer",
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : currentStep > step.id
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </button>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-3 rounded-full overflow-hidden bg-border">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      currentStep > step.id ? "w-full bg-green-500" : "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Labels row */}
        <div className="hidden lg:flex mt-3">
          {steps.map((step, index) => (
            <div key={step.id} className={cn("flex-1 last:flex-none", index < steps.length - 1 ? "pr-6" : "")}>
              <button onClick={() => setCurrentStep(step.id)} title={`Go to Step ${step.id}: ${step.name}`} className="text-left cursor-pointer">
                <p
                  className={cn(
                    "text-sm font-medium",
                    currentStep === step.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.name}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Bar — fixed */}
      <div className="shrink-0 bg-card border border-border rounded-lg p-2 sm:p-3 flex items-center gap-2 mb-4">
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

      {/* Form Content + JSON Preview — scrollable middle */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 min-h-[200px] sm:min-h-[300px]">
        <Card className="bg-card border-border lg:col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="shrink-0">
            <CardTitle className="text-foreground flex items-center gap-2">
              {(() => {
                const StepIcon = steps[currentStep - 1].icon
                return <StepIcon className="h-5 w-5" />
              })()}
              {steps[currentStep - 1].name}
            </CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto overflow-x-auto">{renderStepContent()}</CardContent>
        </Card>

        <Card className="bg-card border-border lg:col-span-1 flex flex-col overflow-hidden max-h-[250px] lg:max-h-none">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-foreground text-sm flex items-center gap-1.5">
              <Eye className="h-4 w-4" /> JSON Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <pre className="text-xs text-muted-foreground bg-muted rounded-md p-3 whitespace-pre-wrap break-all">
              {JSON.stringify(getStepJson(), null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Navigation — sticky bottom */}
      <div className="shrink-0 sticky bottom-0 bg-background flex flex-wrap items-center justify-between gap-2 sm:gap-3 pt-2 pb-2 border-t border-border">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          title="Go to previous step"
          className="cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <Button variant="outline" onClick={handleSaveDraft} title="Save current progress as draft" className="cursor-pointer">
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>

          {currentStep < 5 ? (
            <Button onClick={handleNext} title="Proceed to next step" className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} title="Submit configuration for approval" className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
              <Send className="h-4 w-4 mr-2" />
              Submit for Approval
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
