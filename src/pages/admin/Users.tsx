import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Search, Phone, Mail, User, Edit2, Stethoscope, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsers({ role: initialRole }: { role: 'patient' | 'doctor' | 'admin' }) {
  const [users, setUsers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: initialRole as string,
    assigned_doctor_id: '',
    specialization: ''
  });

  const [editUser, setEditUser] = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/auth/users');
      if (!resp.ok) throw new Error('Failed to fetch users');
      const data = await resp.json();
      setUsers(data.filter((u: any) => u.role === initialRole));
      setDoctors(data.filter((u: any) => u.role === 'doctor'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    setFormData(prev => ({ ...prev, role: initialRole }));
  }, [initialRole]);

  const handleCreate = async () => {
    if (!formData.full_name || !formData.phone || !formData.password) {
      toast.error('Name, Phone and Password are required');
      return;
    }

    try {
      const resp = await fetch('/api/auth/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to create user');
      }

      toast.success(`${formData.role} created successfully`);
      setFormData({ 
        full_name: '', 
        email: '', 
        phone: '', 
        password: '', 
        role: initialRole, 
        assigned_doctor_id: '',
        specialization: ''
      });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    try {
      const resp = await fetch(`/api/auth/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUser)
      });
      if (!resp.ok) throw new Error('Failed to update user');
      toast.success('User updated successfully');
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = users.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) || 
    u.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight capitalize">{initialRole}s</h1>
          <p className="text-muted-foreground">Total {initialRole}s: <span className="font-bold text-slate-900">{users.length}</span> — Manage profiles via fast JSON storage.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            {loading ? <Loader2 className="animate-spin size-4" /> : 'Refresh List'}
          </Button>
          <Dialog>
            <DialogTrigger
              render={
                <Button className="gap-2 shadow-lg shadow-primary/20">
                  <UserPlus size={18} />
                  Add {initialRole}
                </Button>
              }
            />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="text-primary" />
                Create New {formData.role}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Enter name" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="10-digit number" />
              </div>
              <div className="space-y-2">
                <Label>Role Selection</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Set secure password" />
              </div>

              {formData.role === 'doctor' && (
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Input value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} placeholder="e.g. Cardiologist" />
                </div>
              )}

              {formData.role === 'patient' && (
                <div className="space-y-2 mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Stethoscope size={16} />
                    <Label className="font-bold">Instant Queue Assignment</Label>
                  </div>
                  <Select value={formData.assigned_doctor_id} onValueChange={(v) => setFormData({...formData, assigned_doctor_id: v === 'none' ? '' : v})}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Assign a doctor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Registration Only)</SelectItem>
                      {doctors.map(d => (
                        <SelectItem key={d.id} value={d.id}>Dr. {d.full_name} ({d.specialization})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-2">If selected, the patient will immediately receive a queue token.</p>
                </div>
              )}

              <Button className="w-full mt-2 py-6 text-base font-semibold" onClick={handleCreate}>
                 Finalize Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile: {editUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editUser?.full_name || ''} onChange={e => setEditUser({...editUser, full_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={editUser?.phone || ''} onChange={e => setEditUser({...editUser, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editUser?.email || ''} onChange={e => setEditUser({...editUser, email: e.target.value})} />
            </div>
            {editUser?.role === 'doctor' && (
              <div className="space-y-2">
                <Label>Specialization</Label>
                <Input value={editUser?.specialization || ''} onChange={e => setEditUser({...editUser, specialization: e.target.value})} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Update Password</Label>
              <Input type="password" value={editUser?.password || ''} onChange={e => setEditUser({...editUser, password: e.target.value})} placeholder="Enter new password to change" />
              <p className="text-[10px] text-muted-foreground">Leave empty to keep existing password.</p>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editUser?.status || 'active'} onValueChange={(v) => setEditUser({...editUser, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive / Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full mt-4" onClick={handleUpdate}>Update Account</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 text-muted-foreground size-4" />
            <Input 
              placeholder={`Search ${initialRole}s by name or phone...`} 
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
             />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10">No {initialRole}s found</TableCell></TableRow>
              ) : filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-muted flex items-center justify-center"><User size={14} /></div>
                      <div>
                        <p className="font-medium">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{u.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="space-y-1">
                      <p className="text-sm flex items-center gap-1.5"><Phone size={12} className="text-muted-foreground" /> {u.phone}</p>
                      {u.email && <p className="text-xs flex items-center gap-1.5"><Mail size={12} className="text-muted-foreground" /> {u.email}</p>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={`capitalize ${(u.status || 'active') === 'active' ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-700 bg-red-50'}`}>{u.status || 'Active'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Copy Login Details"
                        onClick={() => {
                          const info = `Phone: ${u.phone}${u.password ? `\nPassword: ${u.password}` : ''}`;
                          navigator.clipboard.writeText(info);
                          toast.success('Login details copied to clipboard');
                        }}
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditUser({ 
                        id: u.id,
                        full_name: u.full_name || '',
                        phone: u.phone || '',
                        email: u.email || '',
                        role: u.role || initialRole,
                        status: u.status || 'active',
                        specialization: u.specialization || '',
                        password: '' 
                      })}>
                        <Edit2 size={16} className="text-slate-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
