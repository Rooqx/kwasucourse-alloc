'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Mail, Building, Award, Shield, BookOpen } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  lecturerProfile?: {
    department: { name: string };
    specializations: string[];
    seniorityRank: string;
    maxLoadUnits: number;
  };
}

export default function ProfilePage() {
  const { fetchWithAuth } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetchWithAuth('/api/auth/me');
      const data = await res.json();
      if (data.data) {
        setProfile(data.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
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
                  <p className="text-sm text-muted-foreground">{profile.name}</p>
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
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium leading-none mb-1">Max Load Units</p>
                    <p className="text-sm text-muted-foreground">{profile.lecturerProfile.maxLoadUnits} Units</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {profile.lecturerProfile?.specializations && profile.lecturerProfile.specializations.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <p className="text-sm font-medium leading-none mb-3">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {profile.lecturerProfile.specializations.map((spec, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
