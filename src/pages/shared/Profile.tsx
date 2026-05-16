import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Phone, Mail, Lock, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    password: '',
    specialization: profile?.specialization || '',
    bio: profile?.bio || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    
    try {
      const response = await fetch(`/api/auth/users/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to update profile');
      
      const updatedUser = await response.json();
      // Update local context
      updateProfile(updatedUser);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Profile Settings</h1>
        <p className="text-slate-500 font-medium">Manage your account information and preferences</p>
      </div>

      <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-8">
          <div className="flex items-center gap-6">
            <div className="size-20 rounded-3xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <User size={40} />
            </div>
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">{profile?.full_name}</CardTitle>
              <CardDescription className="text-white/60 font-bold uppercase tracking-widest text-[10px]">
                {profile?.role} • ID: {profile?.id.slice(-8).toUpperCase()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-xs font-black uppercase tracking-widest text-slate-400">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="full_name" value={formData.full_name} onChange={handleChange} className="pl-10 h-12 rounded-xl" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} className="pl-10 h-12 rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-slate-400">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="phone" value={formData.phone} onChange={handleChange} className="pl-10 h-12 rounded-xl" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-400">New Password (Optional)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="password" type="password" value={formData.password} onChange={handleChange} className="pl-10 h-12 rounded-xl" placeholder="Leave blank to keep current" />
                </div>
              </div>
            </div>

            {profile?.role === 'doctor' && (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-xs font-black uppercase tracking-widest text-slate-400">Specialization</Label>
                  <Input id="specialization" value={formData.specialization} onChange={handleChange} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-xs font-black uppercase tracking-widest text-slate-400">Professional Bio</Label>
                  <Textarea id="bio" value={formData.bio} onChange={handleChange} className="rounded-xl min-h-[100px]" />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-14 text-lg font-black uppercase tracking-tighter shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
