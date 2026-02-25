"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Business, BusinessStatus, BusinessCategory, UserRole } from "@/lib/types";
import { logout, setStoredUser, getStoredUser, getAuthToken } from "@/lib/auth";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  FileText,
  Filter,
  X,
  LogOut,
  User,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  UserCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Debounce hook for search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface FilterOptions {
  categories: string[];
  cities: string[];
  areas: string[];
  onboarded_by: string[];
}

interface PaginatedResponse {
  data: any[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  filter_options: FilterOptions;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState<BusinessCategory | "all">(
    (searchParams.get("category") as BusinessCategory) || "all"
  );
  const [cityFilter, setCityFilter] = useState<string>(searchParams.get("city") || "all");
  const [areaFilter, setAreaFilter] = useState<string>(searchParams.get("area") || "all");
  const [onboardedByFilter, setOnboardedByFilter] = useState<string>(searchParams.get("onboarded_by") || "all");
  const [statusFilter, setStatusFilter] = useState<BusinessStatus | "due-date" | "pending" | "all">(
    (searchParams.get("status") as BusinessStatus) || "all"
  );
  const [currentPage, setCurrentPage] = useState<number>(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const pageSize = 20;
  
  const [user, setUser] = useState(getStoredUser());
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(false);
  const [businessesError, setBusinessesError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    cities: [],
    areas: [],
    onboarded_by: [],
  });

  // Debounce search input (300ms delay)
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update URL when filters change
  const updateURL = useCallback((params: Record<string, string>) => {
    const newParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "1") {
        newParams.set(key, value);
      } else if (key === "page" && value !== "1") {
        newParams.set(key, value);
      }
    });
    
    const queryString = newParams.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    router.push(newUrl, { scroll: false });
  }, [router]);

  // Redirect non-admins away from admin dashboard
  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    const isAdmin = currentUser.role === "admin" || currentUser.userType === "admin";
    if (!isAdmin) {
      if (currentUser.userType === "business_qr_user" && currentUser.qrId) {
        router.push(`/dashboard/business/${currentUser.qrId}`);
      } else if (currentUser.role === "sales-team") {
        router.push("/sales-dashboard");
      } else {
        router.push("/dashboard");
      }
      return;
    }
  }, [router]);

  // Fetch businesses with filters and pagination
  useEffect(() => {
    const fetchOnboardedBusinesses = async () => {
      const currentUser = getStoredUser();

      if (!currentUser) return;

      const isAdmin = currentUser.role === "admin" || currentUser.userType === "admin";
      if (!isAdmin) return;

      setIsLoadingBusinesses(true);
      setBusinessesError(null);

      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";
        const authToken = getAuthToken();

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        // Build query params for API call
        const params = new URLSearchParams();
        params.set("page", currentPage.toString());
        params.set("page_size", pageSize.toString());
        
        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }
        if (categoryFilter !== "all") {
          params.set("category", categoryFilter);
        }
        if (statusFilter !== "all" && statusFilter !== "due-date" && statusFilter !== "pending") {
          params.set("status_filter", statusFilter);
        }
        if (cityFilter !== "all") {
          params.set("city", cityFilter);
        }
        if (areaFilter !== "all") {
          params.set("area", areaFilter);
        }
        if (onboardedByFilter !== "all") {
          params.set("onboarded_by", onboardedByFilter);
        }

        const response = await fetch(
          `${apiBaseUrl}/dashboard/v1/business_qr/onboarded_businesses?${params.toString()}`,
          {
            method: "GET",
            headers,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch onboarded businesses");
        }

        const data = await response.json();

        if (data.status !== "success" || !data.data) {
          throw new Error(data.message || "Failed to fetch onboarded businesses");
        }

        // Map API response to Business type
        const mappedBusinesses: Business[] = data.data.map((business: any) => {
          // Sales Team ID logic is deprecated as we don't rely on local storage anymore.
          // In the future this should come from the API if needed.
          const salesTeamId = undefined;

          // Map category from API response, validate it's a valid BusinessCategory
          const validCategories: BusinessCategory[] = [
            "restaurant",
            "retail",
            "healthcare",
            "beauty",
            "fitness",
            "automotive",
            "real-estate",
            "education",
            "hospitality",
            "manufacturing",
            "services",
            "technology",
            "finance",
            "logistics",
            "media-entertainment",
            "non-profit",
            "other",
          ];
          const apiCategory = business.category || business.business_category || business.type;
          const category: BusinessCategory = validCategories.includes(apiCategory)
            ? apiCategory as BusinessCategory
            : "other";

          return {
            id: business.qr_id || `business-${Date.now()}-${Math.random()}`,
            name: business.name || "",
            status: (business.status || "active") as BusinessStatus,
            category: category,
            email: business.email || "",
            phone: business.phone || undefined,
            city: business.city || undefined,
            area: business.area || undefined,
            createdAt: business.created_at || new Date().toISOString(),
            updatedAt: business.created_at || new Date().toISOString(),
            feedbackTone: "friendly" as const, // Default value
            autoReplyEnabled: true, // Default value
            salesTeamId: salesTeamId || undefined,
            onboarded_by: business.onboarded_by || "admin",
            totalReviews: business.feedback_count || 0, // Default value - can be updated if API provides it
            activeReviews: 0,
            inactiveReviews: 0,
            reviewsInQueue: 0,
          };
        });

        setBusinesses(mappedBusinesses);
        
        // Set pagination data from API response
        setTotalCount(data.total || 0);
        setTotalPages(data.total_pages || 0);
        
        // Set filter options from API response
        if (data.filter_options) {
          setFilterOptions(data.filter_options);
        }
      } catch (error) {
        console.error("Error fetching onboarded businesses:", error);
        setBusinessesError(error instanceof Error ? error.message : "Failed to fetch businesses");
        setBusinesses([]);
        setTotalCount(0);
        setTotalPages(0);
      } finally {
        setIsLoadingBusinesses(false);
      }
    };

    fetchOnboardedBusinesses();
    
    // Update URL with current filter state
    updateURL({
      search: debouncedSearch,
      category: categoryFilter,
      status: statusFilter,
      city: cityFilter,
      area: areaFilter,
      onboarded_by: onboardedByFilter,
      page: currentPage.toString(),
    });
  }, [debouncedSearch, categoryFilter, statusFilter, cityFilter, areaFilter, onboardedByFilter, currentPage, updateURL]);

  useEffect(() => {
    const currentUser = getStoredUser();
    if (currentUser) {
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
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    setStoredUser(null);
    router.push("/login");
  };

  // Use filter options from API response
  const uniqueCities = filterOptions.cities;
  const uniqueAreas = filterOptions.areas;
  const uniqueOnboardedBy = filterOptions.onboarded_by;

  // Server-side filtering is now used - businesses array is already filtered from API
  // Keep due-date and pending filters client-side for now (require payment fields)
  const filteredBusinesses = useMemo(() => {
    let filtered = businesses;

    // Apply due-date and pending filters client-side (not yet implemented in backend)
    if (statusFilter === "due-date") {
      const today = new Date();
      const sixtyDaysFromNow = new Date(today);
      sixtyDaysFromNow.setDate(today.getDate() + 60);

      filtered = filtered.filter((business) => {
        if (!business.paymentExpiryDate) return false;
        const expiryDate = new Date(business.paymentExpiryDate);
        return expiryDate <= sixtyDaysFromNow && expiryDate >= today;
      });
    } else if (statusFilter === "pending") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const oneDayAgo = new Date(today);
      oneDayAgo.setDate(today.getDate() - 1);

      filtered = filtered.filter((business) => {
        if (!business.billingDate) return false;
        const billingDate = new Date(business.billingDate);
        billingDate.setHours(0, 0, 0, 0);
        return billingDate <= oneDayAgo && business.paymentStatus !== "active";
      });
    }

    return filtered;
  }, [businesses, statusFilter]);

  const hasActiveFilters = categoryFilter !== "all" || cityFilter !== "all" || areaFilter !== "all" || onboardedByFilter !== "all" || statusFilter !== "all" || searchInput.trim() !== "";

  const clearFilters = () => {
    setSearchInput("");
    setCategoryFilter("all");
    setCityFilter("all");
    setAreaFilter("all");
    setOnboardedByFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value as BusinessCategory | "all");
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as BusinessStatus | "due-date" | "pending" | "all");
    setCurrentPage(1);
  };

  const handleCityFilterChange = (value: string) => {
    setCityFilter(value);
    setAreaFilter("all"); // Reset area when city changes
    setCurrentPage(1);
  };

  const handleAreaChange = (value: string) => {
    setAreaFilter(value);
    setCurrentPage(1);
  };

  const handleOnboardedByChange = (value: string) => {
    setOnboardedByFilter(value);
    setCurrentPage(1);
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push("...");
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      
      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleBusinessClick = (business: Business) => {
    // Use qr_id directly for navigation (business.id is already set to qr_id from API)
    router.push(`/dashboard/business/${business.id}`);
  };

  const getStatusBadge = (status: BusinessStatus) => {
    const variants = {
      active: "default",
      inactive: "secondary",
    } as const;

    const icons = {
      active: <CheckCircle2 className="h-3 w-3 mr-1" />,
      inactive: <XCircle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your businesses and reviews
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <span className="hidden sm:inline">{user.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard/admin/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          </div>
        </div>

        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
                <CardDescription>Filter businesses by category, location, or search</CardDescription>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, category..."
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setCurrentPage(1); // Reset to page 1 on search
                    }}
                    className="pl-10"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category-filter">Category</Label>
                <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="beauty">Beauty</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing/Industrial</SelectItem>
                    <SelectItem value="services">Professional & Local Services</SelectItem>
                    <SelectItem value="technology">Technology / IT / SaaS</SelectItem>
                    <SelectItem value="finance">Financial Services</SelectItem>
                    <SelectItem value="logistics">Logistics & Transport</SelectItem>
                    <SelectItem value="media-entertainment">Media & Entertainment</SelectItem>
                    <SelectItem value="non-profit">Non-profit / NGO</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    {user?.role === "admin" && (
                      <>
                        <SelectItem value="due-date">Due Date</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div className="space-y-2">
                <Label htmlFor="city-filter">City</Label>
                <Select value={cityFilter} onValueChange={handleCityFilterChange}>
                  <SelectTrigger id="city-filter">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {uniqueCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Area Filter */}
              <div className="space-y-2">
                <Label htmlFor="area-filter">Area</Label>
                <Select
                  value={areaFilter}
                  onValueChange={handleAreaChange}
                  disabled={uniqueAreas.length === 0}
                >
                  <SelectTrigger id="area-filter">
                    <SelectValue placeholder={uniqueAreas.length === 0 ? "No areas available" : "All Areas"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    {uniqueAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Onboarded By Filter */}
              <div className="space-y-2">
                <Label htmlFor="onboarded-by-filter">Onboarded By</Label>
                <Select value={onboardedByFilter} onValueChange={handleOnboardedByChange}>
                  <SelectTrigger id="onboarded-by-filter">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueOnboardedBy.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>All Businesses ({totalCount})</CardTitle>
                <CardDescription>
                  {totalCount > 0
                    ? `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCount)} of ${totalCount} businesses`
                    : "No businesses found"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingBusinesses && (user?.role === "admin" || user?.userType === "admin") ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p>Loading businesses...</p>
              </div>
            ) : businessesError && (user?.role === "admin" || user?.userType === "admin") ? (
              <div className="text-center py-8 text-destructive">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">Error loading businesses</p>
                <p className="text-sm text-muted-foreground">{businessesError}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBusinesses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No businesses found</p>
                    {hasActiveFilters && (
                      <Button variant="link" onClick={clearFilters} className="mt-2">
                        Clear filters
                      </Button>
                    )}
                  </div>
                ) : (
                <>
                  {filteredBusinesses.map((business) => (
                    <div
                      key={business.id}
                      onClick={() => handleBusinessClick(business)}
                      className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{business.name}</h3>
                            {getStatusBadge(business.status)}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {business.category.charAt(0).toUpperCase() + business.category.slice(1)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {business.email}
                            </span>
                            {business.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {business.phone}
                              </span>
                            )}
                            {business.city && business.area && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {business.city}, {business.area}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <UserCircle className="h-3 w-3" />
                              Onboarded by {business.onboarded_by}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">{business.totalReviews}</div>
                            <div className="text-xs text-muted-foreground">Total Reviews</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((pageNum, index) => (
                          typeof pageNum === "number" ? (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className="min-w-[36px]"
                            >
                              {pageNum}
                            </Button>
                          ) : (
                            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                              {pageNum}
                            </span>
                          )
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
