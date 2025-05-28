"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Save,
  Clock,
  Loader2,
  Users,
  Shield,
  UserX,
  CheckCircle,
  Search,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useFetch from "@/hooks/use-fetch";
import {
  getDealershipInfo,
  saveWorkingHours,
  getUsers,
  updateUserRole,
} from "@/actions/settings";

// Day names for display
const DAYS = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];

export const SettingsForm = () => {
  const [workingHours, setWorkingHours] = useState(
    DAYS.map((day) => ({
      dayOfWeek: day.value,
      openTime: "09:00",
      closeTime: "18:00",
      isOpen: day.value !== "SUNDAY",
    }))
  );

  const [userSearch, setUserSearch] = useState("");
  const [confirmAdminDialog, setConfirmAdminDialog] = useState(false);
  const [userToPromote, setUserToPromote] = useState(null);
  const [confirmRemoveDialog, setConfirmRemoveDialog] = useState(false);
  const [userToDemote, setUserToDemote] = useState(null);

  // Custom hooks for API calls
  const {
    loading: fetchingSettings,
    fn: fetchDealershipInfo,
    data: settingsData,
    error: settingsError,
  } = useFetch(getDealershipInfo);

  const {
    loading: savingHours,
    fn: saveHours,
    data: saveResult,
    error: saveError,
  } = useFetch(saveWorkingHours);

  const {
    loading: fetchingUsers,
    fn: fetchUsers,
    data: usersData,
    error: usersError,
  } = useFetch(getUsers);

  const {
    loading: updatingRole,
    fn: updateRole,
    data: updateRoleResult,
    error: updateRoleError,
  } = useFetch(updateUserRole);

  // Fetch settings and users on component mount
  useEffect(() => {
    fetchDealershipInfo();
    fetchUsers();
  }, []);

  // Set working hours when settings data is fetched
  useEffect(() => {
    if (settingsData?.success && settingsData.data) {
      const dealership = settingsData.data;
      console.log("Dealership data:", dealership); // Debug log

      // Map the working hours
      if (dealership.workingHours && dealership.workingHours.length > 0) {
        const mappedHours = DAYS.map((day) => {
          // Find matching working hour
          const hourData = dealership.workingHours.find(
            (h) => h.dayOfWeek === day.value
          );

          if (hourData) {
            return {
              dayOfWeek: hourData.dayOfWeek,
              openTime: hourData.openTime || "09:00",
              closeTime: hourData.closeTime || "18:00",
              isOpen: hourData.isOpen !== false, // Default to true if not explicitly false
            };
          }

          // Default values if no working hour is found
          return {
            dayOfWeek: day.value,
            openTime: "09:00",
            closeTime: "18:00",
            isOpen: day.value !== "SUNDAY",
          };
        });

        console.log("Mapped working hours:", mappedHours); // Debug log
        setWorkingHours(mappedHours);
      }
    }
  }, [settingsData]);

  // Handle errors
  useEffect(() => {
    if (settingsError) {
      console.error("Settings error:", settingsError);
      toast.error("Failed to load dealership settings");
    }

    if (saveError) {
      console.error("Save error:", saveError);
      toast.error(`Failed to save working hours: ${saveError.message}`);
    }

    if (usersError) {
      console.error("Users error:", usersError);
      toast.error("Failed to load users");
    }

    if (updateRoleError) {
      console.error("Update role error:", updateRoleError);
      toast.error(`Failed to update user role: ${updateRoleError.message}`);
    }
  }, [settingsError, saveError, usersError, updateRoleError]);

  // Handle successful operations
  useEffect(() => {
    if (saveResult?.success) {
      toast.success("Working hours saved successfully");
      // Don't refetch immediately to avoid overriding user changes
    }

    if (updateRoleResult?.success) {
      toast.success("User role updated successfully");
      fetchUsers();
      setConfirmAdminDialog(false);
      setConfirmRemoveDialog(false);
      setUserToPromote(null);
      setUserToDemote(null);
    }
  }, [saveResult, updateRoleResult]);

  // Handle working hours change
  const handleWorkingHourChange = (index, field, value) => {
    console.log(`Changing ${field} for day ${index} to:`, value); // Debug log
    
    setWorkingHours(prevHours => {
      const updatedHours = [...prevHours];
      updatedHours[index] = {
        ...updatedHours[index],
        [field]: value,
      };
      
      console.log("Updated working hours:", updatedHours); // Debug log
      return updatedHours;
    });
  };

  // Save working hours
  const handleSaveHours = async () => {
    console.log("Saving working hours:", workingHours); // Debug log
    
    // Validate times before saving
    const validHours = workingHours.every(hour => {
      if (!hour.isOpen) return true;
      
      const openTime = new Date(`1970-01-01T${hour.openTime}:00`);
      const closeTime = new Date(`1970-01-01T${hour.closeTime}:00`);
      
      if (closeTime <= openTime) {
        toast.error(`Invalid hours for ${DAYS.find(d => d.value === hour.dayOfWeek)?.label}: Close time must be after open time`);
        return false;
      }
      
      return true;
    });
    
    if (!validHours) return;
    
    try {
      await saveHours(workingHours);
    } catch (error) {
      console.error("Error saving hours:", error);
      toast.error("Failed to save working hours");
    }
  };

  // Make user admin
  const handleMakeAdmin = async () => {
    if (!userToPromote) return;
    
    try {
      await updateRole(userToPromote.id, "ADMIN");
    } catch (error) {
      console.error("Error making admin:", error);
      toast.error("Failed to make user admin");
    }
  };

  // Remove admin privileges
  const handleRemoveAdmin = async () => {
    if (!userToDemote) return;
    
    try {
      await updateRole(userToDemote.id, "USER");
    } catch (error) {
      console.error("Error removing admin:", error);
      toast.error("Failed to remove admin privileges");
    }
  };

  // Filter users by search term
  const filteredUsers = usersData?.success
    ? usersData.data.filter(
        (user) =>
          user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
          user.email.toLowerCase().includes(userSearch.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="hours">
        <TabsList>
          <TabsTrigger value="hours">
            <Clock className="h-4 w-4 mr-2" />
            Working Hours
          </TabsTrigger>
          <TabsTrigger value="admins">
            <Shield className="h-4 w-4 mr-2" />
            Admin Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hours" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Working Hours</CardTitle>
              <CardDescription>
                Set your dealership's working hours for each day of the week.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DAYS.map((day, index) => {
                  const dayHours = workingHours[index];
                  
                  return (
                    <div
                      key={day.value}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-4 px-4 rounded-lg border hover:bg-slate-50"
                    >
                      <div className="md:col-span-2">
                        <div className="font-medium text-sm">{day.label}</div>
                      </div>

                      <div className="md:col-span-2 flex items-center">
                        <Checkbox
                          id={`is-open-${day.value}`}
                          checked={dayHours?.isOpen || false}
                          onCheckedChange={(checked) => {
                            console.log(`Toggle ${day.label} open/closed:`, checked);
                            handleWorkingHourChange(index, "isOpen", checked);
                          }}
                        />
                        <Label
                          htmlFor={`is-open-${day.value}`}
                          className="ml-2 cursor-pointer text-sm"
                        >
                          {dayHours?.isOpen ? "Open" : "Closed"}
                        </Label>
                      </div>

                      {dayHours?.isOpen ? (
                        <>
                          <div className="md:col-span-3">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <Input
                                type="time"
                                value={dayHours.openTime || "09:00"}
                                onChange={(e) => {
                                  console.log(`Open time change for ${day.label}:`, e.target.value);
                                  handleWorkingHourChange(index, "openTime", e.target.value);
                                }}
                                className="text-sm"
                              />
                            </div>
                          </div>

                          <div className="md:col-span-1 text-center text-sm text-gray-500">
                            to
                          </div>

                          <div className="md:col-span-3">
                            <Input
                              type="time"
                              value={dayHours.closeTime || "18:00"}
                              onChange={(e) => {
                                console.log(`Close time change for ${day.label}:`, e.target.value);
                                handleWorkingHourChange(index, "closeTime", e.target.value);
                              }}
                              className="text-sm"
                            />
                          </div>

                          <div className="md:col-span-1">
                            {/* Status indicator */}
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="md:col-span-8 text-gray-500 italic text-sm">
                          Closed all day
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {workingHours.filter(h => h.isOpen).length} days open
                </div>
                <Button onClick={handleSaveHours} disabled={savingHours}>
                  {savingHours ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Working Hours
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>
                Manage users with admin privileges.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-9 w-full"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              {fetchingUsers ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : usersData?.success && filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {user.imageUrl ? (
                                  <img
                                    src={user.imageUrl}
                                    alt={user.name || "User"}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Users className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                              <span>{user.name || "Unnamed User"}</span>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                user.role === "ADMIN"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {user.role === "ADMIN" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setUserToDemote(user);
                                  setConfirmRemoveDialog(true);
                                }}
                                disabled={updatingRole}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Remove Admin
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setUserToPromote(user);
                                  setConfirmAdminDialog(true);
                                }}
                                disabled={updatingRole}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Make Admin
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No users found
                  </h3>
                  <p className="text-gray-500">
                    {userSearch
                      ? "No users match your search criteria"
                      : "There are no users registered yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confirm Make Admin Dialog */}
          <Dialog
            open={confirmAdminDialog}
            onOpenChange={setConfirmAdminDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Admin Privileges</DialogTitle>
                <DialogDescription>
                  Are you sure you want to give admin privileges to{" "}
                  {userToPromote?.name || userToPromote?.email}? Admin users can
                  manage all aspects of the dealership.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmAdminDialog(false);
                    setUserToPromote(null);
                  }}
                  disabled={updatingRole}
                >
                  Cancel
                </Button>
                <Button onClick={handleMakeAdmin} disabled={updatingRole}>
                  {updatingRole ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirm
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Confirm Remove Admin Dialog */}
          <Dialog
            open={confirmRemoveDialog}
            onOpenChange={setConfirmRemoveDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Admin Privileges</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove admin privileges from{" "}
                  {userToDemote?.name || userToDemote?.email}? They will no
                  longer be able to access the admin dashboard.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmRemoveDialog(false);
                    setUserToDemote(null);
                  }}
                  disabled={updatingRole}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRemoveAdmin}
                  disabled={updatingRole}
                >
                  {updatingRole ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    "Remove Admin"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};