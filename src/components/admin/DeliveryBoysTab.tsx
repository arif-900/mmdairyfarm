import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Bike, UserPlus, Pencil, Trash2, Key } from "lucide-react";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function DeliveryBoysTab() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // New Delivery Boy Form State
    const [newStaff, setNewStaff] = useState({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        role: "delivery_boy"
    });

    // Edit Profile State
    const [editingProfile, setEditingProfile] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({
        full_name: "",
        phone: "",
        address: ""
    });

    // Reset Password State
    const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [isResetting, setIsResetting] = useState(false);

    const { toast } = useToast();

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const { data: profilesData, error: profilesError } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });

            if (profilesError) throw profilesError;

            // Fetch roles to enrich the profiles
            const { data: rolesData, error: rolesError } = await supabase
                .from("user_roles")
                .select("*")
                .eq("role", "delivery_boy" as any);

            if (rolesError) throw rolesError;

            const deliveryBoyIds = new Set(rolesData?.map(r => r.user_id));
            const filteredProfiles = (profilesData || []).filter(p => deliveryBoyIds.has(p.user_id));

            setProfiles(filteredProfiles);
        } catch (error: any) {
            console.error("Error fetching delivery boys:", error);
            toast({
                title: "Error fetching delivery boys",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const handleEditClick = (profile: any) => {
        setEditingProfile(profile);
        setEditForm({
            full_name: profile.full_name || "",
            phone: profile.phone || "",
            address: profile.address || ""
        });
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProfile) return;

        try {
            const { error } = await supabase
                .from("profiles")
                .update(editForm)
                .eq("user_id", editingProfile.user_id);

            if (error) throw error;

            toast({
                title: "Profile Updated",
                description: `${editForm.full_name}'s details have been saved.`,
            });

            setEditingProfile(null);
            fetchProfiles();
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleDeleteProfile = async (userId: string, name: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete ${name}? This will remove their login and all profile data.`)) return;

        try {
            const { data, error } = await supabase.functions.invoke('delete-staff', {
                body: { targetUserId: userId }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            toast({
                title: "Account Deleted",
                description: `${name}'s account has been completely removed.`,
            });
            fetchProfiles();
        } catch (error: any) {
            console.error("Error deleting profile:", error);
            toast({
                title: "Deletion Failed",
                description: "Cannot delete account. Ensure the delete-staff Edge Function is deployed.",
                variant: "destructive",
            });
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetPasswordUser || !newPassword) return;

        try {
            setIsResetting(true);
            const { data, error } = await supabase.functions.invoke('reset-password-admin', {
                body: { 
                    targetUserId: resetPasswordUser.user_id,
                    newPassword: newPassword
                }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            toast({
                title: "Password Reset Successful",
                description: `Password for ${resetPasswordUser.full_name} has been updated.`,
            });
            setResetPasswordUser(null);
            setNewPassword("");
        } catch (error: any) {
            console.error("Error resetting password:", error);
            toast({
                title: "Reset Failed",
                description: error.message || "Ensure the reset-password-admin Edge Function is deployed.",
                variant: "destructive",
            });
        } finally {
            setIsResetting(false);
        }
    };

    const handleCreateDeliveryBoy = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsCreating(true);

            // Call our custom Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('create-staff', {
                body: newStaff
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            toast({
                title: "Account Created!",
                description: `${newStaff.full_name} has been added as a Delivery Boy.`,
            });

            setDialogOpen(false);
            setNewStaff({ email: "", password: "", full_name: "", phone: "", role: "delivery_boy" });
            
            // Give the database a moment to reflect the new account and role
            setTimeout(() => {
                fetchProfiles();
            }, 2000);

        } catch (error: any) {
            console.error("Error creating delivery boy:", error);
            toast({
                title: "Failed to create account",
                description: error.message || "Ensure the Edge Function is deployed.",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Bike className="h-6 w-6 text-primary" />
                    Delivery Boy Management
                </h2>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add Delivery Boy
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Delivery Boy Account</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateDeliveryBoy} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    required
                                    value={newStaff.full_name}
                                    onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={newStaff.email}
                                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    required
                                    value={newStaff.phone}
                                    onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Temporary Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newStaff.password}
                                    onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full mt-4" disabled={isCreating}>
                                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Create Account
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Profile Dialog */}
                <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Delivery Boy Details</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_full_name">Full Name</Label>
                                <Input
                                    id="edit_full_name"
                                    required
                                    value={editForm.full_name}
                                    onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_phone">Phone Number</Label>
                                <Input
                                    id="edit_phone"
                                    required
                                    value={editForm.phone}
                                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_address">Address</Label>
                                <Input
                                    id="edit_address"
                                    value={editForm.address}
                                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full mt-4">
                                Save Changes
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Reset Password Dialog */}
                <Dialog open={!!resetPasswordUser} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
                    <DialogContent aria-describedby={undefined}>
                        <DialogHeader>
                            <DialogTitle>Reset Delivery Boy Password</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
                            <p className="text-sm text-muted-foreground">
                                Setting a new password for <strong>{resetPasswordUser?.full_name}</strong>.
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="new_password">New Password</Label>
                                <Input
                                    id="new_password"
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                />
                            </div>
                            <Button type="submit" className="w-full mt-4" disabled={isResetting}>
                                {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Update Password
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Delivery Boy</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : profiles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No delivery boys found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            profiles.map((profile) => (
                                <TableRow key={profile.id}>
                                    <TableCell className="font-medium">{profile.full_name}</TableCell>
                                    <TableCell>{profile.phone}</TableCell>
                                    <TableCell className="text-muted-foreground truncate max-w-[200px]">
                                        {profile.address || "No address set"}
                                    </TableCell>
                                    <TableCell className="text-right whitespace-nowrap">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                            onClick={() => handleEditClick(profile)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 ml-1"
                                            onClick={() => setResetPasswordUser(profile)}
                                            title="Reset Password"
                                        >
                                            <Key className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 ml-1"
                                            onClick={() => handleDeleteProfile(profile.user_id, profile.full_name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
