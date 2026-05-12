/**
 * Roles and Permissions management page.
 * Provides UI for creating, viewing, and managing roles and permissions.
 */

import { useState, useEffect, useCallback } from "react";
import { BASE_URL } from "~/config";
import { useAuthStore } from "~/lib/stores/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { toast } from "sonner";
import { Shield, Key, Plus, Trash2, Edit } from "lucide-react";

/**
 * Permission type from API.
 */
interface Permission {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Role type from API.
 */
interface Role {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Roles and Permissions page component.
 */
export function RolesPermissionsPage() {
  const { accessToken: token } = useAuthStore();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("permissions");

  // Permission dialog state
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permForm, setPermForm] = useState({ name: "", description: "" });
  const [permEditId, setPermEditId] = useState<string | null>(null);

  // Role dialog state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    isDefault: false,
    permissionIds: "",
  });
  const [roleEditId, setRoleEditId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [permRes, roleRes] = await Promise.all([
        fetch(`${BASE_URL}/api/roles/permissions`, { headers }),
        fetch(`${BASE_URL}/api/roles`, { headers }),
      ]);

      if (permRes.ok) {
        const permData = await permRes.json();
        setPermissions(permData.permissions || []);
      }

      if (roleRes.ok) {
        const roleData = await roleRes.json();
        setRoles(roleData.roles || []);
      }
    } catch (error) {
      console.error("Failed to fetch roles/permissions:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSeedPermissions = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${BASE_URL}/api/roles/permissions/seed`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Default permissions seeded successfully");
        fetchData();
      } else {
        toast.error("Failed to seed permissions");
      }
    } catch {
      toast.error("Error seeding permissions");
    }
  };

  const handleSavePermission = async () => {
    if (!token || !permForm.name.trim()) return;

    try {
      const method = permEditId ? "PUT" : "POST";
      const url = permEditId
        ? `${BASE_URL}/api/roles/permissions/${permEditId}`
        : `${BASE_URL}/api/roles/permissions`;

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(permForm),
      });

      if (res.ok) {
        toast.success(permEditId ? "Permission updated" : "Permission created");
        setPermDialogOpen(false);
        setPermForm({ name: "", description: "" });
        setPermEditId(null);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save permission");
      }
    } catch {
      toast.error("Error saving permission");
    }
  };

  const handleDeletePermission = async (id: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${BASE_URL}/api/roles/permissions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Permission deleted");
        fetchData();
      } else {
        toast.error("Failed to delete permission");
      }
    } catch {
      toast.error("Error deleting permission");
    }
  };

  const handleSaveRole = async () => {
    if (!token || !roleForm.name.trim()) return;

    try {
      const method = roleEditId ? "PUT" : "POST";
      const url = roleEditId ? `${BASE_URL}/api/roles/${roleEditId}` : `${BASE_URL}/api/roles`;

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(roleForm),
      });

      if (res.ok) {
        toast.success(roleEditId ? "Role updated" : "Role created");
        setRoleDialogOpen(false);
        setRoleForm({ name: "", description: "", isDefault: false, permissionIds: "" });
        setRoleEditId(null);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save role");
      }
    } catch {
      toast.error("Error saving role");
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${BASE_URL}/api/roles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Role deleted");
        fetchData();
      } else {
        toast.error("Failed to delete role");
      }
    } catch {
      toast.error("Error deleting role");
    }
  };

  const openEditPermission = (perm: Permission) => {
    setPermEditId(perm.id);
    setPermForm({ name: perm.name, description: perm.description || "" });
    setPermDialogOpen(true);
  };

  const openEditRole = (role: Role) => {
    setRoleEditId(role.id);
    setRoleForm({
      name: role.name,
      description: role.description || "",
      isDefault: role.isDefault,
      permissionIds: role.permissions.join(","),
    });
    setRoleDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
          <p className="text-muted-foreground">Manage user roles and their permissions</p>
        </div>
        <Button variant="outline" onClick={handleSeedPermissions}>
          <Key className="mr-2 h-4 w-4" />
          Seed Default Permissions
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setPermEditId(null);
                setPermForm({ name: "", description: "" });
                setPermDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Permission
            </Button>
          </div>

          {permissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No permissions found. Click "Seed Default Permissions" to create system permissions.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {permissions.map((perm) => (
                <Card key={perm.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        {perm.name}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditPermission(perm)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePermission(perm.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {perm.description || "No description"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setRoleEditId(null);
                setRoleForm({ name: "", description: "", isDefault: false, permissionIds: "" });
                setRoleDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </div>

          {roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No roles found. Create a role to get started.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {role.name}
                        {role.isDefault && <Badge variant="secondary">Default</Badge>}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditRole(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {role.description || "No description"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((p) => (
                        <Badge key={p} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Permission Dialog */}
      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{permEditId ? "Edit Permission" : "Create Permission"}</DialogTitle>
            <DialogDescription>Define a new permission for your system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="perm-name">Name</Label>
              <Input
                id="perm-name"
                value={permForm.name}
                onChange={(e) => setPermForm({ ...permForm, name: e.target.value })}
                placeholder="e.g., dashboard:read"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perm-desc">Description</Label>
              <Input
                id="perm-desc"
                value={permForm.description}
                onChange={(e) => setPermForm({ ...permForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermission}>{permEditId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{roleEditId ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>Define a new role with specific permissions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="e.g., moderator"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="role-default"
                checked={roleForm.isDefault}
                onChange={(e) => setRoleForm({ ...roleForm, isDefault: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="role-default" className="font-normal">
                Set as default role for new users
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-perms">Permissions (comma-separated IDs)</Label>
              <Input
                id="role-perms"
                value={roleForm.permissionIds}
                onChange={(e) => setRoleForm({ ...roleForm, permissionIds: e.target.value })}
                placeholder="e.g., perm1,perm2,perm3"
              />
              <p className="text-xs text-muted-foreground">
                Available: {permissions.map((p) => p.id).join(", ") || "No permissions"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole}>{roleEditId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}