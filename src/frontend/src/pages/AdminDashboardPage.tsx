import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@dfinity/principal";
import { Copy, Trash2, UserMinus, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDemoteUser,
  useGetActiveAccountsCount,
  useGetAllUsers,
  useGetDonateText,
  useGetVisitorStats,
  useIsCallerAdmin,
  usePermanentlyDeleteAccount,
  usePromoteUser,
  useRecordVisit,
  useSetDonateText,
} from "../hooks/useQueries";
import { useGetUserProfile } from "../hooks/useQueries";

const PERMANENT_ADMIN_PRINCIPAL =
  "a7dxs-nk6zm-shch4-6mlx5-xd7vi-bqjwf-euhqd-d47mb-mtbhj-4o34v-2qe";

// Row component so each row can call useGetUserProfile at the top level
function UserRow({
  principal,
  onAction,
}: {
  principal: Principal;
  onAction: (
    principal: string,
    action: "promote" | "demote" | "delete",
  ) => void;
}) {
  const principalStr = principal.toString();
  const { data: profile } = useGetUserProfile(principalStr);

  return (
    <TableRow>
      <TableCell className="font-medium">
        {profile?.username || "Unknown"}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs truncate max-w-[200px]">
            {principalStr}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => {
              navigator.clipboard.writeText(principalStr);
              toast.success("Principal copied to clipboard");
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Promote to admin"
            onClick={() => onAction(principalStr, "promote")}
          >
            <UserPlus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Demote from admin"
            onClick={() => onAction(principalStr, "demote")}
          >
            <UserMinus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="Delete account"
            onClick={() => onAction(principalStr, "delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AdminDashboardPage() {
  const { identity } = useInternetIdentity();
  const {
    data: isAdmin,
    isLoading: isAdminLoading,
    isFetched: isAdminFetched,
  } = useIsCallerAdmin();
  const { data: allUsers, isLoading: usersLoading } = useGetAllUsers();
  const { data: activeAccountsCount } = useGetActiveAccountsCount();
  const { data: visitorStats, isLoading: visitorStatsLoading } =
    useGetVisitorStats();
  const recordVisitMutation = useRecordVisit();

  const promoteUserMutation = usePromoteUser();
  const demoteUserMutation = useDemoteUser();
  const deleteAccountMutation = usePermanentlyDeleteAccount();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [actionType, setActionType] = useState<
    "promote" | "demote" | "delete" | null
  >(null);
  const [donateTextInput, setDonateTextInput] = useState("");
  const { data: currentDonateText } = useGetDonateText();
  const setDonateTextMutation = useSetDonateText();

  useEffect(() => {
    if (currentDonateText !== undefined) {
      setDonateTextInput(currentDonateText);
    }
  }, [currentDonateText]);

  // Check if current user is the permanent admin — bypass loading state entirely
  const callerPrincipal = identity?.getPrincipal().toString();
  const isPermanentAdmin = callerPrincipal === PERMANENT_ADMIN_PRINCIPAL;
  const isAuthenticated = !!identity;

  // Record visit once on page load for authenticated users only
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once when auth changes
  useEffect(() => {
    if (isAuthenticated && callerPrincipal) {
      recordVisitMutation.mutate();
    }
  }, [isAuthenticated, callerPrincipal]);

  const openConfirmDialog = (
    principal: string,
    action: "promote" | "demote" | "delete",
  ) => {
    setSelectedUser(principal);
    setActionType(action);
  };

  const confirmAction = async () => {
    if (!selectedUser || !actionType) return;

    try {
      if (actionType === "promote") {
        await promoteUserMutation.mutateAsync(selectedUser);
        toast.success("User promoted to admin");
      } else if (actionType === "demote") {
        await demoteUserMutation.mutateAsync(selectedUser);
        toast.success("User demoted from admin");
      } else if (actionType === "delete") {
        await deleteAccountMutation.mutateAsync(selectedUser);
        toast.success("User account deleted");
      }
    } catch {
      toast.error(`Failed to ${actionType} user`);
    }

    setSelectedUser(null);
    setActionType(null);
  };

  // Show loading state while checking admin status (skip for permanent admin)
  if (!isPermanentAdmin && (isAdminLoading || !isAdminFetched)) {
    return (
      <div className="container max-w-7xl mx-auto p-4 pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Show access denied only after we've confirmed the user is not an admin
  if (!isPermanentAdmin && isAdmin === false) {
    return (
      <div className="container max-w-7xl mx-auto p-4 pt-20">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const actionLabels: Record<string, string> = {
    promote: "promote this user to admin",
    demote: "demote this user from admin",
    delete: "permanently delete this user account",
  };

  return (
    <div className="container max-w-7xl mx-auto p-4 pt-20 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users and view platform statistics
        </p>
      </div>

      {/* Existing counters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeAccountsCount !== undefined
                ? activeAccountsCount.toString()
                : "0"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allUsers ? allUsers.length : "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visitor counters */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Unique Visitors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Daily Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visitorStatsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {visitorStats ? visitorStats.daily.toString() : "0"}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Weekly Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visitorStatsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {visitorStats ? visitorStats.weekly.toString() : "0"}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visitorStatsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {visitorStats ? visitorStats.monthly.toString() : "0"}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                All-Time Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visitorStatsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {visitorStats ? visitorStats.allTime.toString() : "0"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Principal ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers && allUsers.length > 0 ? (
                  allUsers.map(([principal]) => (
                    <UserRow
                      key={principal.toString()}
                      principal={principal}
                      onAction={openConfirmDialog}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Donate Popup Text */}
      <Card>
        <CardHeader>
          <CardTitle>Donate Popup Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This text appears in the donate popup shown to all users when they
            click the heart button in the header.
          </p>
          <Textarea
            value={donateTextInput}
            onChange={(e) => setDonateTextInput(e.target.value)}
            rows={5}
            placeholder="Enter donate popup text..."
            data-ocid="admin.donate_text.textarea"
          />
          <Button
            onClick={async () => {
              try {
                await setDonateTextMutation.mutateAsync(donateTextInput);
                toast.success("Donate text updated");
              } catch {
                toast.error("Failed to update donate text");
              }
            }}
            disabled={setDonateTextMutation.isPending}
            data-ocid="admin.donate_text.save_button"
          >
            {setDonateTextMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>

      {/* Confirm Action Dialog */}
      <AlertDialog
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null);
            setActionType(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {actionType ? actionLabels[actionType] : "perform this action"}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={
                actionType === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
