'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, User, Mail, Building, Award, Shield, BookOpen, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LecturerData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  lecturerProfile?: {
    specialization: string;
    seniorityRank: string;
    maxLoadUnits: number;
    department?: { name: string };
  };
}

export default function ProfilePage() {
  const { user, fetchWithAuth } = useAuth();
  const [profile, setProfile] = useState<LecturerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [specialization, setSpecialization] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetchWithAuth(`/api/lecturers/${user!.id}`);
      const data = await res.json();
      if (data.data) {
        setProfile(data.data);
        if (data.data.lecturerProfile) {
          setSpecialization(data.data.lecturerProfile.specialization || '');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetchWithAuth(`/api/lecturers/${user!.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ specialization }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      toast.success('Specialization updated successfully');
      setProfile(prev => prev ? {
        ...prev,
        lecturerProfile: {
          ...prev.lecturerProfile!,
          specialization: data.data.specialization
        }
      } : null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update specialization');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin size-8 text-muted-foreground" /></div>;
  }

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Lecturer Profile</CardTitle>
          <CardDescription>Your personal and academic details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-3">
                <User className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium leading-none mb-1">Full Name</p>
                  <p className="text-sm text-muted-foreground">{profile.fullName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium leading-none mb-1">Email Address</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium leading-none mb-1">Role</p>
                  <p className="text-sm text-muted-foreground">{profile.role}</p>
                </div>
              </div>
            </div>

            {profile.lecturerProfile && (
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-3">
                  <Building className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium leading-none mb-1">Department</p>
                    <p className="text-sm text-muted-foreground">{profile.lecturerProfile.department?.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium leading-none mb-1">Seniority Rank</p>
                    <p className="text-sm text-muted-foreground">{profile.lecturerProfile.seniorityRank}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 bg-muted/50 inline-block px-1.5 py-0.5 rounded">Contact your Admin to change this</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium leading-none mb-1">Max Load Units</p>
                    <p className="text-sm text-muted-foreground">{profile.lecturerProfile.maxLoadUnits} Units</p>
                    <p className="text-[10px] text-muted-foreground mt-1 bg-muted/50 inline-block px-1.5 py-0.5 rounded">Contact your Admin to change this</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {profile.lecturerProfile && (
            <div className="mt-8 pt-6 border-t flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium leading-none mb-1">Specialization</p>
                <p className="text-xs text-muted-foreground mb-3">Update your specialization to help the allocation algorithm match you with the right courses.</p>
              </div>
              <div className="flex items-center gap-3 max-w-md">
                <Input 
                  value={specialization} 
                  onChange={(e) => setSpecialization(e.target.value)} 
                  placeholder="e.g. Software Engineering"
                />
                <Button onClick={handleSave} disabled={isSaving || specialization === profile.lecturerProfile.specialization}>
                  {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                  Save
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
