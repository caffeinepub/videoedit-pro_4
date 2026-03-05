import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Principal } from "@icp-sdk/core/principal";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Loader2, Shield, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppUserRole } from "../../backend";
import type { UserProfile } from "../../backend";
import { useActor } from "../../hooks/useActor";
import { useAssignCallerUserRole, useGetAllJobs } from "../../hooks/useQueries";

function useGetKnownPrincipals() {
  const { data: jobs } = useGetAllJobs();

  // Collect unique principals from jobs
  const principals = new Set<string>();
  for (const job of jobs || []) {
    principals.add(job.clientId.toString());
    if (job.assignedEditorId) {
      principals.add(job.assignedEditorId.toString());
    }
  }

  return Array.from(principals);
}

function UserRow({
  principalStr,
  index,
}: {
  principalStr: string;
  index: number;
}) {
  const { actor } = useActor();
  const assignRole = useAssignCallerUserRole();
  const [selectedRole, setSelectedRole] = useState<"admin" | "user">("user");

  const { data: profile, isLoading } = useQuery<UserProfile | null>({
    queryKey: ["userProfile", principalStr],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserProfile(Principal.fromText(principalStr));
    },
    enabled: !!actor,
  });

  const handleRoleChange = async () => {
    try {
      await assignRole.mutateAsync({ user: principalStr, role: selectedRole });
      toast.success(
        `Role updated for ${profile?.name || principalStr.slice(0, 12)}…`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update role.",
      );
    }
  };

  return (
    <TableRow
      data-ocid={`admin.users.item.${index + 1}`}
      className="border-border hover:bg-muted/20"
    >
      <TableCell>
        {isLoading ? (
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        ) : (
          <span className="font-medium text-sm">{profile?.name || "—"}</span>
        )}
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {principalStr.slice(0, 20)}…
      </TableCell>
      <TableCell>
        {profile?.appRole ? (
          <Badge
            variant="secondary"
            className={
              profile.appRole === AppUserRole.editor
                ? "bg-[oklch(0.65_0.16_230/0.15)] text-[oklch(0.75_0.16_230)] border-[oklch(0.65_0.16_230/0.4)]"
                : "bg-muted text-muted-foreground"
            }
          >
            {profile.appRole === AppUserRole.editor ? (
              <Briefcase className="w-3 h-3 mr-1" />
            ) : (
              <Users className="w-3 h-3 mr-1" />
            )}
            {profile.appRole}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">No profile</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Select
            value={selectedRole}
            onValueChange={(v) => setSelectedRole(v as "admin" | "user")}
          >
            <SelectTrigger
              data-ocid="admin.users.role.select"
              className="h-8 w-28 text-xs bg-input"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button
            data-ocid="admin.users.role.save_button"
            size="sm"
            variant="outline"
            onClick={handleRoleChange}
            disabled={assignRole.isPending}
            className="h-8 text-xs gap-1.5"
          >
            {assignRole.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Shield className="w-3 h-3" />
            )}
            Set
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ManageUsers() {
  const principals = useGetKnownPrincipals();
  const [customPrincipal, setCustomPrincipal] = useState("");
  const [displayList, setDisplayList] = useState<string[]>([]);

  // Initialize display list from known principals
  const allPrincipals = [...new Set([...principals, ...displayList])];

  const handleAddPrincipal = () => {
    if (!customPrincipal.trim()) return;
    try {
      // Validate principal format
      Principal.fromText(customPrincipal.trim());
      setDisplayList((prev) => [...new Set([...prev, customPrincipal.trim()])]);
      setCustomPrincipal("");
    } catch {
      toast.error("Invalid principal ID format.");
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Manage Users
        </CardTitle>
        <CardDescription>
          View known users and manage their system roles. Add a principal to
          look up any user.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add principal manually */}
        <div className="flex items-end gap-3 p-4 rounded-lg border border-border bg-muted/10">
          <div className="flex-1 space-y-2">
            <Label htmlFor="add-principal" className="text-xs font-mono">
              ADD USER BY PRINCIPAL
            </Label>
            <Input
              id="add-principal"
              data-ocid="admin.users.input"
              placeholder="aaaaa-bbbbb-ccccc-ddddd-eee"
              value={customPrincipal}
              onChange={(e) => setCustomPrincipal(e.target.value)}
              className="bg-input text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAddPrincipal()}
            />
          </div>
          <Button
            data-ocid="admin.users.add_button"
            onClick={handleAddPrincipal}
            disabled={!customPrincipal.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </Button>
        </div>

        {/* Users table */}
        {allPrincipals.length === 0 ? (
          <div
            data-ocid="admin.users.empty_state"
            className="text-center py-12 text-muted-foreground"
          >
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              No users yet. Users appear here once they submit jobs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table data-ocid="admin.users.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs font-mono text-muted-foreground">
                    NAME
                  </TableHead>
                  <TableHead className="text-xs font-mono text-muted-foreground">
                    PRINCIPAL
                  </TableHead>
                  <TableHead className="text-xs font-mono text-muted-foreground">
                    ROLE
                  </TableHead>
                  <TableHead className="text-xs font-mono text-muted-foreground">
                    UPDATE ROLE
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPrincipals.map((principal, i) => (
                  <UserRow key={principal} principalStr={principal} index={i} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
