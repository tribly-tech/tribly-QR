"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getStoredUser,
  setStoredUser,
  getAuthToken,
  logout,
  User
} from "@/lib/auth";
import { UserRole } from "@/lib/types";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Shield,
  Users,
  Plus,
  Trash2,
  Save,
  LogOut,
  Settings,
  CheckCircle2,
  X,
  Edit,
  Loader2,
  AlertCircle,
  RefreshCw,
  Building2,
  MapPin,
  Briefcase
} from "lucide-react";
import { DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// API Sales Team Member type (aligned with add form: name, mobile, email, role, location)
interface SalesTeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  location?: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [lastSavedProfileData, setLastSavedProfileData] = useState<{
    name: string;
    email: string;
    phone: string;
  } | null>(null);
  const [salesTeam, setSalesTeam] = useState<SalesTeamMember[]>([]);
  const [isLoadingSalesTeam, setIsLoadingSalesTeam] = useState(false);
  const [salesTeamError, setSalesTeamError] = useState<string | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  const [updateMemberError, setUpdateMemberError] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    name: "",
    mobile: "",
    email: "",
    role: "",
    location: "",
    password: "",
  });
  const [editingMember, setEditingMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    location: "",
  });
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  const isAdmin = !!user && (user.role === "admin" || user.userType === "admin" || (!user.role && (user.email === "admin@tribly.com" || user.email === "admin@tribly.ai")));

  // Fetch sales team from API
  const fetchSalesTeam = useCallback(async () => {
    setIsLoadingSalesTeam(true);
    setSalesTeamError(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";
      const authToken = getAuthToken();

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${apiBaseUrl}/dashboard/v1/business_qr/sales_team`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch sales team");
      }

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(data.message || "Failed to fetch sales team");
      }

      // Map API response to local format (internal data points: name, mobile, email, role, location)
      const mappedTeam: SalesTeamMember[] = (data.data || []).map((member: any, index: number) => ({
        id: member.id || member._id || `member-${Date.now()}-${index}`,
        name: member.name || "",
        email: member.email || "",
        phone: member.phone || member.mobile || "",
        role: member.role || "",
        location: member.location || "",
        createdAt: member.created_at || member.createdAt || new Date().toISOString(),
      }));

      setSalesTeam(mappedTeam);
    } catch (error: any) {
      console.error("Error fetching sales team:", error);
      setSalesTeamError(error.message || "Failed to load sales team");
    } finally {
      setIsLoadingSalesTeam(false);
    }
  }, []);

  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    salesTeam.forEach((m) => {
      if (m.location?.trim()) set.add(m.location.trim());
    });
    return Array.from(set).sort();
  }, [salesTeam]);

  const filteredSalesTeam = useMemo(() => {
    return salesTeam.filter((member) => {
      if (roleFilter !== "all" && (member.role || "") !== roleFilter) return false;
      if (locationFilter !== "all" && (member.location || "") !== locationFilter) return false;
      return true;
    });
  }, [salesTeam, roleFilter, locationFilter]);

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }

    // Ensure user has role property (migration for existing users)
    if (!currentUser.role) {
      let role: UserRole = "business"; // Default fallback

      // Check userType first
      const userType = (currentUser.userType || "").toLowerCase().trim();
      if (userType === "admin") {
        role = "admin";
      } else if (userType === "business_qr_user") {
        role = "business";
      }
      // Then check email
      else if (currentUser.email === "admin@tribly.com" || currentUser.email === "admin@tribly.ai") {
        role = "admin";
      }

      const updatedUser = {
        ...currentUser,
        role: role,
      };
      setStoredUser(updatedUser);
      setUser(updatedUser);
    } else {
      setUser(currentUser);
    }

    const initial = {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || "",
    };
    setProfileData(initial);
    setLastSavedProfileData(initial);

    // Fetch sales team for admin users
    const isUserAdmin = currentUser.role === "admin" || (!currentUser.role && currentUser.email === "admin@tribly.com");
    if (isUserAdmin) {
      fetchSalesTeam();
    }
  }, [router, fetchSalesTeam]);

  const hasProfileChanges = useMemo(() => {
    if (!lastSavedProfileData) return false;
    return (
      profileData.name !== lastSavedProfileData.name ||
      profileData.email !== lastSavedProfileData.email ||
      profileData.phone !== lastSavedProfileData.phone
    );
  }, [profileData, lastSavedProfileData]);

  const handleSaveProfile = () => {
    if (user) {
      const updatedUser = {
        ...user,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      };
      setStoredUser(updatedUser);
      setUser(updatedUser);
      setLastSavedProfileData({ ...profileData });
    }
  };

  const handleAddSalesTeamMember = async () => {
    if (!newMember.name.trim() || !newMember.email.trim()) {
      setAddMemberError("Please fill in all required fields");
      return;
    }

    const mobileDigits = newMember.mobile.replace(/\D/g, "");
    const last4FromMobile = mobileDigits.slice(-4);
    const passwordToUse = newMember.password.trim() || last4FromMobile;

    if (passwordToUse.length !== 4 || !/^\d{4}$/.test(passwordToUse)) {
      setAddMemberError("Password must be 4 digits. Enter a 4-digit PIN or ensure mobile number has at least 4 digits.");
      return;
    }

    setIsAddingMember(true);
    setAddMemberError(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";
      const authToken = getAuthToken();

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const payload: Record<string, string> = {
        name: newMember.name.trim(),
        email: newMember.email.trim().toLowerCase(),
        password: passwordToUse,
      };
      if (newMember.mobile.trim()) {
        payload.phone = newMember.mobile.trim();
        payload.mobile = newMember.mobile.trim();
      }
      if (newMember.role) payload.role = newMember.role;
      if (newMember.location.trim()) payload.location = newMember.location.trim();

      const response = await fetch(`${apiBaseUrl}/dashboard/v1/business_qr/sales_team`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        const message = data.message || "Failed to add member";
        const details = data.errors ? (Array.isArray(data.errors) ? data.errors.join(", ") : JSON.stringify(data.errors)) : "";
        setAddMemberError(details ? `${message}: ${details}` : message);
        return;
      }

      // Refresh the sales team list
      await fetchSalesTeam();

      // Reset form and close dialog
      setNewMember({ name: "", mobile: "", email: "", role: "", location: "", password: "" });
      setAddMemberError(null);
      setIsAddMemberOpen(false);
    } catch (error: any) {
      setAddMemberError(error.message || "Failed to add member. Please try again.");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveSalesTeamMember = (memberId: string) => {
    // For now, just remove from local state
    // TODO: Add API call for deletion when available
    setSalesTeam(prevTeam => prevTeam.filter(m => m.id !== memberId));
  };

  const handleEditSalesTeamMember = (member: SalesTeamMember) => {
    setEditingMemberId(member.id);
    setEditingMember({
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      role: member.role || "",
      location: member.location || "",
    });
    setUpdateMemberError(null);
    setIsEditMemberOpen(true);
  };

  const handleUpdateSalesTeamMember = async () => {
    if (!editingMemberId || !editingMember.name || !editingMember.email) {
      setUpdateMemberError("Please fill in all required fields");
      return;
    }

    setIsUpdatingMember(true);
    setUpdateMemberError(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";
      const authToken = getAuthToken();

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${apiBaseUrl}/dashboard/v1/business_qr/sales_team`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          id: editingMemberId,
          name: editingMember.name.trim(),
          email: editingMember.email.trim().toLowerCase(),
          phone: editingMember.phone?.trim() || "",
          role: editingMember.role?.trim() || undefined,
          location: editingMember.location?.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Failed to update sales team member");
      }

      // Refresh the sales team list
      await fetchSalesTeam();

      // Reset form and close dialog
      setEditingMember({ name: "", email: "", phone: "" });
      setEditingMemberId(null);
      setIsEditMemberOpen(false);
    } catch (error: any) {
      console.error("Error updating sales team member:", error);
      setUpdateMemberError(error.message || "Failed to update member. Please try again.");
    } finally {
      setIsUpdatingMember(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setStoredUser(null);
    router.push("/login");
  };


  const getRoleBadge = (role?: UserRole) => {
    const userRole = role || (
      (user?.email === "admin@tribly.com" || user?.email === "admin@tribly.ai" || user?.userType === "admin")
        ? "admin"
        : "sales-team"
    );

    if (userRole === "admin") {
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-300">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      );
    } else if (userRole === "business") {
      return (
        <Badge variant="outline">
          <Building2 className="h-3 w-3 mr-1" />
          Business
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-300">
          <Users className="h-3 w-3 mr-1" />
          Sales Team
        </Badge>
      );
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/admin")}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
              <p className="text-muted-foreground">Manage your profile and account settings</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* User Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditProfileOpen(true)}
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="Edit profile"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                {getRoleBadge(user?.role)}
              </div>
              <p className="text-muted-foreground">{user.email}</p>
              {user.phone && (
                <p className="text-sm text-muted-foreground mt-0.5">{user.phone}</p>
              )}
            </CardContent>
          </Card>

          {/* Edit profile dialog */}
          <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit personal information</DialogTitle>
                <DialogDescription>
                  Update your name, email, and phone number
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="pl-10"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="pl-10"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="pl-10"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleSaveProfile();
                    setIsEditProfileOpen(false);
                  }}
                  disabled={!hasProfileChanges}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Sales Team (Admin Only) */}
          {isAdmin && (
          <div>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Team Management</h3>
                          <p className="text-sm text-muted-foreground">
                            Manage your team members
                          </p>
                        </div>
                        <Dialog open={isAddMemberOpen} onOpenChange={(open) => {
                          setIsAddMemberOpen(open);
                          if (!open) {
                            setNewMember({ name: "", mobile: "", email: "", role: "", location: "", password: "" });
                            setAddMemberError(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button className="gap-2">
                              <Plus className="h-4 w-4" />
                              Add Member
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add new team member</DialogTitle>
                              <DialogDescription>
                                Add a new member to your team
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              {addMemberError && (
                                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                  {addMemberError}
                                </div>
                              )}
                              <div className="grid gap-2">
                                <Label htmlFor="member-name">Full name *</Label>
                                <div className="relative">
                                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id="member-name"
                                    value={newMember.name}
                                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                    placeholder="Enter full name"
                                    className="pl-10"
                                    disabled={isAddingMember}
                                  />
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="member-mobile">Mobile number</Label>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id="member-mobile"
                                    type="tel"
                                    value={newMember.mobile}
                                    onChange={(e) => {
                                      const mobile = e.target.value;
                                      const digits = mobile.replace(/\D/g, "");
                                      const last4 = digits.slice(-4);
                                      setNewMember((prev) => ({
                                        ...prev,
                                        mobile,
                                        password: last4.length === 4 ? last4 : prev.password,
                                      }));
                                    }}
                                    placeholder="e.g. +91 98765 43210"
                                    className="pl-10"
                                    disabled={isAddingMember}
                                  />
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label>Password (4 digits) *</Label>
                                <div className="flex gap-2">
                                  {[0, 1, 2, 3].map((i) => (
                                    <Input
                                      key={i}
                                      type="text"
                                      inputMode="numeric"
                                      maxLength={1}
                                      value={newMember.password[i] ?? ""}
                                      readOnly
                                      disabled={isAddingMember}
                                      className="h-12 w-12 text-center text-lg font-semibold tabular-nums bg-muted/50"
                                    />
                                  ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Fixed: last 4 digits of mobile number. Enter the mobile number above to set the password.
                                </p>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="member-email">Email ID *</Label>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id="member-email"
                                    type="email"
                                    value={newMember.email}
                                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                    placeholder="member@example.com"
                                    className="pl-10"
                                    disabled={isAddingMember}
                                  />
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label>Role</Label>
                                <div className="flex flex-wrap gap-4 pt-1">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="member-role"
                                      value="Marketing/Sales executive"
                                      checked={newMember.role === "Marketing/Sales executive"}
                                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                      disabled={isAddingMember}
                                      className="h-4 w-4 border-input text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium">Marketing/Sales executive</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                                    <input
                                      type="radio"
                                      name="member-role"
                                      value="Manager"
                                      checked={newMember.role === "Manager"}
                                      disabled
                                      className="h-4 w-4 border-input text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium">Manager (disabled)</span>
                                  </label>
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="member-location">Location</Label>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id="member-location"
                                    value={newMember.location}
                                    onChange={(e) => setNewMember({ ...newMember, location: e.target.value })}
                                    placeholder="Enter location"
                                    className="pl-10"
                                    disabled={isAddingMember}
                                  />
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsAddMemberOpen(false)}
                                disabled={isAddingMember}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleAddSalesTeamMember}
                                disabled={!newMember.name.trim() || !newMember.email.trim() || (newMember.password.length !== 4 && newMember.mobile.replace(/\D/g, "").length < 4) || isAddingMember}
                              >
                                {isAddingMember ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Add Member
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={isEditMemberOpen} onOpenChange={(open) => {
                          setIsEditMemberOpen(open);
                          if (!open) {
                            setEditingMember({ name: "", email: "", phone: "", role: "", location: "" });
                            setEditingMemberId(null);
                            setUpdateMemberError(null);
                          }
                        }}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Sales Team Member</DialogTitle>
                              <DialogDescription>
                                Update the details of this sales team member
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              {updateMemberError && (
                                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                  {updateMemberError}
                                </div>
                              )}
                              <div className="grid gap-2">
                                <Label htmlFor="edit-member-name">Full Name *</Label>
                                <div className="relative">
                                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id="edit-member-name"
                                    value={editingMember.name}
                                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                                    placeholder="Enter full name"
                                    className="pl-10"
                                    disabled={isUpdatingMember}
                                  />
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-member-email">Email Address *</Label>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id="edit-member-email"
                                    type="email"
                                    value={editingMember.email}
                                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                                    placeholder="member@example.com"
                                    className="pl-10"
                                    disabled={isUpdatingMember}
                                  />
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-member-phone">Mobile number</Label>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id="edit-member-phone"
                                    type="tel"
                                    value={editingMember.phone}
                                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                                    className="pl-10"
                                    disabled={isUpdatingMember}
                                    placeholder="e.g. +91 98765 43210"
                                  />
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label>Role</Label>
                                <div className="flex flex-wrap gap-4 pt-1">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="edit-member-role"
                                      value="Marketing/Sales executive"
                                      checked={editingMember.role === "Marketing/Sales executive"}
                                      onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                                      disabled={isUpdatingMember}
                                      className="h-4 w-4 border-input text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium">Marketing/Sales executive</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                                    <input
                                      type="radio"
                                      name="edit-member-role"
                                      value="Manager"
                                      checked={editingMember.role === "Manager"}
                                      disabled
                                      className="h-4 w-4 border-input text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium">Manager (disabled)</span>
                                  </label>
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-member-location">Location</Label>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    id="edit-member-location"
                                    value={editingMember.location}
                                    onChange={(e) => setEditingMember({ ...editingMember, location: e.target.value })}
                                    className="pl-10"
                                    disabled={isUpdatingMember}
                                    placeholder="Enter location"
                                  />
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsEditMemberOpen(false)}
                                disabled={isUpdatingMember}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleUpdateSalesTeamMember}
                                disabled={!editingMember.name || !editingMember.email || isUpdatingMember}
                              >
                                {isUpdatingMember ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Update Member
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      {isLoadingSalesTeam ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <Loader2 className="h-8 w-8 animate-spin mb-4" />
                          <p>Loading sales team...</p>
                        </div>
                      ) : salesTeamError ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive opacity-50" />
                          <p className="text-destructive">{salesTeamError}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 gap-2"
                            onClick={fetchSalesTeam}
                          >
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                          </Button>
                        </div>
                      ) : salesTeam.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No sales team members yet</p>
                          <p className="text-sm mt-2">Click "Add Member" to get started</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="filter-role" className="text-sm whitespace-nowrap">Role</Label>
                              <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger id="filter-role" className="w-[200px]">
                                  <SelectValue placeholder="All roles" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All roles</SelectItem>
                                  <SelectItem value="Marketing/Sales executive">Marketing/Sales executive</SelectItem>
                                  <SelectItem value="Manager" disabled>Manager (disabled)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor="filter-location" className="text-sm whitespace-nowrap">Location</Label>
                              <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger id="filter-location" className="w-[200px]">
                                  <SelectValue placeholder="All locations" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All locations</SelectItem>
                                  {uniqueLocations.map((loc) => (
                                    <SelectItem key={loc} value={loc}>
                                      {loc}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Mobile</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredSalesTeam.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No members match the selected filters.
                                  </TableCell>
                                </TableRow>
                              ) : (
                              filteredSalesTeam.map((member) => (
                                <TableRow key={member.id}>
                                  <TableCell className="font-medium">{member.name}</TableCell>
                                  <TableCell>{member.phone || "-"}</TableCell>
                                  <TableCell>{member.email}</TableCell>
                                  <TableCell>{member.role || "-"}</TableCell>
                                  <TableCell>{member.location || "-"}</TableCell>
                                  <TableCell>
                                    {member.createdAt
                                      ? new Date(member.createdAt).toLocaleDateString()
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditSalesTeamMember(member)}
                                        className="hover:text-primary"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveSalesTeamMember(member.id)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                        </>
                      )}
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
