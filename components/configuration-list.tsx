"use client"

import { useConfig, type Configuration } from "@/lib/config-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Eye, Edit, Copy, Send } from "lucide-react"

interface ConfigurationListProps {
  onCreateNew: () => void
  onEdit: (config: Configuration) => void
  onView: (config: Configuration) => void
}

const statusColors: Record<Configuration["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

const statusLabels: Record<Configuration["status"], string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
}

export function ConfigurationList({ onCreateNew, onEdit, onView }: ConfigurationListProps) {
  const { configurations, submitForApproval } = useConfig()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Configured Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage your service configurations
          </p>
        </div>
        <Button onClick={onCreateNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add New Service
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search services..." className="pl-10" />
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg bg-card overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-foreground font-semibold">Configured Services</TableHead>
              <TableHead className="text-foreground font-semibold">Status</TableHead>
              <TableHead className="text-foreground font-semibold">Generation (CCSGen)</TableHead>
              <TableHead className="text-foreground font-semibold">Created By</TableHead>
              <TableHead className="text-foreground font-semibold">Last Updated</TableHead>
              <TableHead className="text-foreground font-semibold w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configurations.map((config) => (
              <TableRow key={config.id} className="hover:bg-muted/30">
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{config.serviceDetails?.serviceName || config.name}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-xs">
                      {config.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[config.status]} variant="secondary">
                    {statusLabels[config.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground">
                  {config.serviceDetails?.ccsGen || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {config.createdBy.split("@")[0]}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {config.updatedAt.toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(config)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {config.status === "draft" && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(config)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => submitForApproval(config.id)}>
                            <Send className="h-4 w-4 mr-2" />
                            Submit for Approval
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Clone
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
