import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Hospital, Phone, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, profile } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      navigate(`/${profile.role}`);
    }
  }, [profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await login(phone, password);
      toast.success('Successfully logged in');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-card p-8 shadow-xl border sm:p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex aspect-square size-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
            <Hospital size={28} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">MediQueue</h1>
            <p className="text-sm text-muted-foreground">
              Smart Healthcare Management System
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <Input 
                id="phone"
                type="tel"
                placeholder="1234567890" 
                className="pl-10"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <Input 
                id="password"
                type="password"
                placeholder="••••••••" 
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button 
            type="submit"
            size="lg" 
            className="w-full font-semibold shadow-md active:scale-95 transition-all gap-2" 
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Sign In'
            )}
          </Button>
          
          <p className="text-[10px] text-muted-foreground text-center">
            Default Admin: 1234567890 / admin
          </p>
        </form>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-center gap-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
            <span>Admin</span>
            <span>•</span>
            <span>Doctor</span>
            <span>•</span>
            <span>Patient</span>
          </div>
        </div>
      </div>
    </div>
  );
}
