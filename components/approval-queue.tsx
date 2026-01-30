"use client"

import { useState } from "react"
import { useConfig, type Configuration } from "@/lib/config-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  Car,
  Settings,
  Smartphone,
  Bell,
  Activity,
  HardDrive,
  ArrowRight,
} from "lucide-react"

export function ApprovalQueue() {
  const { configurations, approveConfiguration, rejectConfiguration } = useConfig()
  const { user } = useAuth()
  const [selectedConfig, setSelectedConfig] = useState<Configuration | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve")
  const [comments, setComments] = useState("")

  const pendingApprovals = configurations.filter((c) => c.status === "submitted")
  const recentlyProcessed = configurations.filter(
    (c) => c.status === "approved" || c.status === "rejected"
  )

  const handleApprovalAction = (config: Configuration, action: "approve" | "reject") => {
    setSelectedConfig(config)
    setApprovalAction(action)
    setComments("")
    setShowApprovalDialog(true)
  }

  const confirmAction = () => {
    if (selectedConfig) {
      if (approvalAction === "approve") {
        approveConfiguration(selectedConfig.id, comments)
      } else {
        rejectConfiguration(selectedConfig.id, comments)
      }
      setShowApprovalDialog(false)
      setSelectedConfig(null)
    }
  }

  if (user?.role !== "approver" && user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Access Denied</h3>
            <p className="text-muted-foreground mt-2">
              You don't have permission to access the approval queue.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Approval Queue</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve configuration submissions
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="pending" className="data-[state=active]:bg-card">
            Pending ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="processed" className="data-[state=active]:bg-card">
            Recently Processed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">All Caught Up!</h3>
                <p className="text-muted-foreground mt-2">
                  No configurations pending approval.
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingApprovals.map((config) => (
              <Card key={config.id} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-foreground">{config.name}</CardTitle>
                      <CardDescription className="mt-1">{config.description}</CardDescription>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">Pending Review</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Config Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Submitted By</p>
                        <p className="text-sm font-medium text-foreground">{config.createdBy.split("@")[0]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Vehicle</p>
                        <p className="text-sm font-medium text-foreground">
                          {config.vehiclePayload.vehicleModel} {config.vehiclePayload.year}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">ECU Type</p>
                        <p className="text-sm font-medium text-foreground">{config.vehiclePayload.ecuType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Submitted</p>
                        <p className="text-sm font-medium text-foreground">
                          {config.updatedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Configuration Flow Preview */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg overflow-x-auto">
                    <div className="flex items-center gap-2 min-w-max">
                      <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md">
                        <Settings className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-foreground">Master Config</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-foreground">App Payload</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md">
                        <Car className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-foreground">Vehicle Payload</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md">
                        <Bell className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-foreground">ACK Config</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-foreground">Operation Result</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedConfig(config)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                      onClick={() => handleApprovalAction(config, "reject")}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      className="bg-green-600 text-white hover:bg-green-700"
                      onClick={() => handleApprovalAction(config, "approve")}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {recentlyProcessed.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="pt-6 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No History</h3>
                <p className="text-muted-foreground mt-2">
                  No configurations have been processed yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            recentlyProcessed.map((config) => (
              <Card key={config.id} className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {config.status === "approved" ? (
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{config.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {config.vehiclePayload.vehicleModel} {config.vehiclePayload.year} - {config.vehiclePayload.ecuType}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={
                          config.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {config.status === "approved" ? "Approved" : "Rejected"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {config.approvedAt?.toLocaleDateString() || config.updatedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {config.approvalComments && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Comments: </span>
                        {config.approvalComments}
                      </p>
                    </div>
                  )}
                  {config.status === "approved" && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <HardDrive className="h-4 w-4" />
                      <span>Configuration stored in File Storage</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {approvalAction === "approve" ? "Approve Configuration" : "Reject Configuration"}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "approve"
                ? "This configuration will be approved and stored in file storage."
                : "This configuration will be rejected and sent back for revision."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium text-foreground">{selectedConfig?.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedConfig?.vehiclePayload.vehicleModel} {selectedConfig?.vehiclePayload.year}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Comments {approvalAction === "reject" && "(required)"}
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  approvalAction === "approve"
                    ? "Add any notes for this approval..."
                    : "Explain why this configuration is being rejected..."
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={approvalAction === "reject" && !comments}
              className={
                approvalAction === "approve"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {approvalAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!selectedConfig && !showApprovalDialog} onOpenChange={() => setSelectedConfig(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selectedConfig?.name}</DialogTitle>
            <DialogDescription>{selectedConfig?.description}</DialogDescription>
          </DialogHeader>
          {selectedConfig && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Master Config</p>
                  <p className="text-sm font-medium text-foreground mt-1">UID: {selectedConfig.masterConfig.uid}</p>
                  <p className="text-sm text-foreground">CCS: {selectedConfig.masterConfig.ccsGen}</p>
                  <p className="text-sm text-foreground">Gateway: {selectedConfig.masterConfig.gateway}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Application Payload</p>
                  <p className="text-sm font-medium text-foreground mt-1">App: {selectedConfig.applicationPayload.appId}</p>
                  <p className="text-sm text-foreground">Version: {selectedConfig.applicationPayload.version}</p>
                  <p className="text-sm text-foreground truncate">Endpoint: {selectedConfig.applicationPayload.endpoint}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Vehicle Payload</p>
                  <p className="text-sm font-medium text-foreground mt-1">{selectedConfig.vehiclePayload.vehicleModel} {selectedConfig.vehiclePayload.year}</p>
                  <p className="text-sm text-foreground">ECU: {selectedConfig.vehiclePayload.ecuType}</p>
                  <p className="text-sm text-foreground">VIN: {selectedConfig.vehiclePayload.vin || "N/A"}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">ACK Config</p>
                  <p className="text-sm font-medium text-foreground mt-1">Timeout: {selectedConfig.ackConfig.timeout}ms</p>
                  <p className="text-sm text-foreground">Retries: {selectedConfig.ackConfig.retryCount}</p>
                  <p className="text-sm text-foreground">Type: {selectedConfig.ackConfig.acknowledgmentType}</p>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Operation Result</p>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <p className="text-sm text-foreground">Success: {selectedConfig.operationResult.successCriteria}</p>
                  <p className="text-sm text-foreground">Error: {selectedConfig.operationResult.errorHandling}</p>
                  <p className="text-sm text-foreground">Log: {selectedConfig.operationResult.loggingLevel}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedConfig(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
