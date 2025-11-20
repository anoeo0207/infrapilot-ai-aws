"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import supabase from "@/lib/supabase/client";

type ProfileState = {
  fullName: string;
  email: string;
};

const emptyProfile: ProfileState = {
  fullName: "",
  email: "",
};

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [profile, setProfile] = useState<ProfileState>(emptyProfile);
  const [persisted, setPersisted] = useState<ProfileState>(emptyProfile);

  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // LOAD PROFILE (KHÔNG CÓ AVATAR)
  useEffect(() => {
    if (status === "loading") return;
    let isMounted = true;

    const loadProfile = async () => {
      if (!userId || status !== "authenticated") {
        if (isMounted) {
          setProfile(emptyProfile);
          setPersisted(emptyProfile);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("name, email")
          .eq("id", userId)
          .single();

        if (!isMounted) return;

        if (error && error.code !== "PGRST116") {
          console.error("Failed to load profile:", error.message);
          return;
        }

        const mapped: ProfileState = {
          fullName: data?.name ?? "",
          email: data?.email ?? "",
        };

        setProfile(mapped);
        setPersisted(mapped);
      } catch (e) {
        console.error("Unexpected error:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [status, userId]);

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(persisted);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!hasChanges || !userId) return;

    const sanitized = {
      name: profile.fullName.trim(),  // 🔥 FIXED
      email: profile.email.trim(),
    };

    const { error } = await supabase
      .from("users")
      .update(sanitized)
      .eq("id", userId);

    if (error) {
      console.error("Failed to save profile:", error.message);
      return;
    }

    const newPersisted: ProfileState = {
      fullName: sanitized.name, // 🔥 FIXED
      email: sanitized.email,
    };

    setProfile(newPersisted);
    setPersisted(newPersisted);

    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setProfile(persisted);
    setIsEditing(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your personal information
            </p>
          </div>
        </div>

        <Card className="p-6">
          {/* Top */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Personal Information</h2>
          </div>

          {/* AVATAR + SILVER BADGE */}
          <div className="flex justify-center mt-6 relative">
            <div className="flex flex-col items-center relative">
              <Image
                className="w-28 h-28 rounded-full border border-primary shadow-md"
                src="/logo/web-app-manifest-512x512.png"
                alt="Avatar"
                width={112}
                height={112}
              />

              <div
                className="absolute translate-y-2 px-3 py-1 rounded-full flex items-center gap-1 text-xs text-black font-medium"
                style={{
                  top: "100%",
                  left: "60%",
                  background:
                    "linear-gradient(135deg, #e6e6e6, #bfbfbf, #d9d9d9)",
                }}
              >
                <BadgeCheck className="w-3 h-3" />
                Silver
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="space-y-4 mt-10">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                readOnly={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                name="email"
                value={profile.email}
                onChange={handleChange}
                readOnly={!isEditing}
              />
            </div>

            {saved && (
              <div className="p-3 rounded-md bg-green-500/10 text-green-700 text-sm">
                Changes saved successfully
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
