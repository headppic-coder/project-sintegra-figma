import { useState, useEffect } from 'react';
import { Shield, UserCog, Lock, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { PageHeader } from '../../components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { PermissionProtectedRoute } from '../../components/permission-protected-route';
import { Can } from '../../components/can';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  permissions: string[];
}

interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  module: string;
}

interface User {
  id: string;
  username: string;
  nama_user: string;
  email: string;
  role: string;
  is_active: boolean;
}

export function AccessSettings() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsByModule, setPermissionsByModule] = useState<Record<string, Permission[]>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Role management state
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: [] as string[]
  });

  // User role assignment state
  const [showUserRoleDialog, setShowUserRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleForUser, setSelectedRoleForUser] = useState('');

  // View role detail
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [showRoleDetailDialog, setShowRoleDetailDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData, permsGrouped, usersData] = await Promise.all([
        api.getRoles(),
        api.getPermissions(),
        api.getPermissionsByModule(),
        api.getUsers()
      ]);

      setRoles(rolesData || []);
      setPermissions(permsData || []);
      setPermissionsByModule(permsGrouped || {});
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  // Role Management
  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      display_name: '',
      description: '',
      permissions: []
    });
    setShowRoleDialog(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      display_name: role.display_name,
      description: role.description,
      permissions: role.permissions || []
    });
    setShowRoleDialog(true);
  };

  const handleViewRole = (role: Role) => {
    setViewingRole(role);
    setShowRoleDetailDialog(true);
  };

  const handleSaveRole = async () => {
    try {
      if (!roleForm.name || !roleForm.display_name) {
        toast.error('Nama role dan display name wajib diisi');
        return;
      }

      if (editingRole) {
        await api.updateRole(editingRole.name, roleForm);
        toast.success('Role berhasil diperbarui');
      } else {
        await api.createRole(roleForm);
        toast.success('Role berhasil dibuat');
      }

      setShowRoleDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Gagal menyimpan role');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus role "${role.display_name}"?`)) return;

    try {
      await api.deleteRole(role.name);
      toast.success('Role berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Gagal menghapus role');
    }
  };

  // Permission toggle
  const togglePermission = (permissionName: string) => {
    const currentPerms = roleForm.permissions || [];
    if (currentPerms.includes(permissionName)) {
      setRoleForm({
        ...roleForm,
        permissions: currentPerms.filter(p => p !== permissionName)
      });
    } else {
      setRoleForm({
        ...roleForm,
        permissions: [...currentPerms, permissionName]
      });
    }
  };

  // User Role Assignment
  const handleAssignRole = (user: User) => {
    setSelectedUser(user);
    setSelectedRoleForUser(user.role || '');
    setShowUserRoleDialog(true);
  };

  const handleSaveUserRole = async () => {
    if (!selectedUser || !selectedRoleForUser) {
      toast.error('Pilih role untuk user');
      return;
    }

    try {
      await api.assignRoleToUser(selectedUser.username, selectedRoleForUser);
      toast.success('Role berhasil ditetapkan ke user');
      setShowUserRoleDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Gagal menetapkan role');
    }
  };

  // Module colors
  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      sales: 'bg-blue-100 text-blue-700',
      hrga: 'bg-green-100 text-green-700',
      master: 'bg-purple-100 text-purple-700',
      system: 'bg-orange-100 text-orange-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[module] || colors.other;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionProtectedRoute permission="manage-roles">
      <div className="space-y-6">
        <PageHeader
          title="Pengaturan Akses"
          description="Kelola roles, permissions, dan akses user"
          icon={Shield}
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'System' },
            { label: 'Pengaturan Akses' },
          ]}
        />

        <Tabs defaultValue="roles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              User Access
            </TabsTrigger>
          </TabsList>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Daftar Roles</h3>
                <p className="text-sm text-muted-foreground">
                  Total: {roles.length} roles
                </p>
              </div>
              <Can permission="manage-roles">
                <Button onClick={handleCreateRole}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Role
                </Button>
              </Can>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{role.display_name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {role.name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {role.permissions?.length || 0} permissions
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {role.description}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRole(role)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Detail
                      </Button>
                      <Can permission="manage-roles">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        {role.name !== 'super-admin' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRole(role)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Hapus
                          </Button>
                        )}
                      </Can>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Daftar Permissions</h3>
              <p className="text-sm text-muted-foreground">
                Total: {permissions.length} permissions dikelompokkan berdasarkan module
              </p>
            </div>

            {Object.entries(permissionsByModule).map(([module, perms]) => (
              <Card key={module}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={getModuleColor(module)}>
                      {module.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-normal text-muted-foreground">
                      ({perms.length} permissions)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {perms.map((perm) => (
                      <div
                        key={perm.id}
                        className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{perm.display_name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {perm.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {perm.description}
                            </p>
                          </div>
                          <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">User Access Management</h3>
              <p className="text-sm text-muted-foreground">
                Kelola role yang ditetapkan ke setiap user
              </p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left p-3 text-xs font-medium">Username</th>
                        <th className="text-left p-3 text-xs font-medium">Nama</th>
                        <th className="text-left p-3 text-xs font-medium">Email</th>
                        <th className="text-left p-3 text-xs font-medium">Role</th>
                        <th className="text-left p-3 text-xs font-medium">Status</th>
                        <th className="text-left p-3 text-xs font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 text-sm font-medium">{user.username}</td>
                          <td className="p-3 text-sm">{user.nama_user}</td>
                          <td className="p-3 text-sm">{user.email}</td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {user.role || 'No Role'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={user.is_active ? 'default' : 'secondary'}
                              className={user.is_active ? 'bg-green-600' : 'bg-gray-400'}
                            >
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Can permission="manage-roles">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignRole(user)}
                              >
                                Ubah Role
                              </Button>
                            </Can>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Role Create/Edit Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? 'Edit Role' : 'Tambah Role Baru'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roleName">Nama Role *</Label>
                  <Input
                    id="roleName"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    placeholder="sales-manager"
                    disabled={!!editingRole}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: lowercase dengan dash (-)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    value={roleForm.display_name}
                    onChange={(e) => setRoleForm({ ...roleForm, display_name: e.target.value })}
                    placeholder="Sales Manager"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Deskripsi role..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Pilih permissions yang akan diberikan ke role ini
                </p>

                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getModuleColor(module)}>
                        {module.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {perms.filter(p => roleForm.permissions.includes(p.name)).length} / {perms.length} selected
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((perm) => (
                        <div key={perm.name} className="flex items-start space-x-2">
                          <Checkbox
                            id={`perm-${perm.name}`}
                            checked={roleForm.permissions.includes(perm.name)}
                            onCheckedChange={() => togglePermission(perm.name)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`perm-${perm.name}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {perm.display_name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {perm.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveRole}>
                {editingRole ? 'Perbarui' : 'Buat'} Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Role Detail Dialog */}
        <Dialog open={showRoleDetailDialog} onOpenChange={setShowRoleDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Role: {viewingRole?.display_name}</DialogTitle>
            </DialogHeader>

            {viewingRole && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nama Role</Label>
                    <p className="font-medium">{viewingRole.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Display Name</Label>
                    <p className="font-medium">{viewingRole.display_name}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Deskripsi</Label>
                  <p>{viewingRole.description}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground mb-2 block">
                    Permissions ({viewingRole.permissions?.length || 0})
                  </Label>
                  <div className="space-y-2">
                    {Object.entries(permissionsByModule).map(([module, perms]) => {
                      const rolePerms = perms.filter(p => viewingRole.permissions?.includes(p.name));
                      if (rolePerms.length === 0) return null;

                      return (
                        <div key={module} className="border rounded-lg p-3">
                          <Badge className={`${getModuleColor(module)} mb-2`}>
                            {module.toUpperCase()}
                          </Badge>
                          <div className="grid grid-cols-2 gap-2">
                            {rolePerms.map(perm => (
                              <div key={perm.name} className="text-sm">
                                ✓ {perm.display_name}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* User Role Assignment Dialog */}
        <Dialog open={showUserRoleDialog} onOpenChange={setShowUserRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tetapkan Role ke User</DialogTitle>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium">{selectedUser.nama_user} ({selectedUser.username})</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selectRole">Pilih Role</Label>
                  <Select value={selectedRoleForUser} onValueChange={setSelectedRoleForUser}>
                    <SelectTrigger id="selectRole">
                      <SelectValue placeholder="Pilih role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.filter(r => r.name && typeof r.name === 'string' && r.name.trim() !== '').map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.display_name} ({role.permissions?.length || 0} permissions)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRoleForUser && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium mb-2">Preview Permissions:</p>
                    <div className="flex flex-wrap gap-1">
                      {roles
                        .find(r => r.name === selectedRoleForUser)
                        ?.permissions?.map(perm => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserRoleDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveUserRole}>
                Tetapkan Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionProtectedRoute>
  );
}
