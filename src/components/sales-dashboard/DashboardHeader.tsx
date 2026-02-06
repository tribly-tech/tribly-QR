"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ChevronDown, QrCode } from "lucide-react";

interface User {
  name: string;
  email: string;
  role: string;
}

interface DashboardHeaderProps {
  user: User | null;
  qrId: string | null;
  onLogout: () => void;
}

export function DashboardHeader({
  user,
  qrId,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Onboard Business
        </h1>
        <p className="text-muted-foreground">
          Fill in the business details to onboard a new client
        </p>
        {qrId && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              <QrCode className="h-3.5 w-3.5" />
              QR ID: <span className="font-mono font-semibold">{qrId}</span>
            </Badge>
          </div>
        )}
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
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
