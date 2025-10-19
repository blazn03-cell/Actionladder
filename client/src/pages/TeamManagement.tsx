import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Users, Crown, Shield, Plus, UserPlus, Trash2, Lock, Clock, Construction } from "lucide-react";
import type { Team, TeamPlayer, Player } from "@shared/schema";

export default function TeamManagement() {
  const { toast } = useToast();

  // TEAM FUNCTIONALITY LOCKED DOWN - Show Coming Soon UI
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-400 mb-2">Team Management</h1>
        <p className="text-gray-400">Create and manage your pool hall teams</p>
      </div>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 bg-orange-900/20 border border-orange-700 rounded-full w-fit">
            <Construction className="h-8 w-8 text-orange-400" />
          </div>
          <CardTitle className="text-2xl text-orange-400">Team Management Coming Soon</CardTitle>
          <CardDescription className="text-gray-300">
            Team creation and management features are currently under development
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-6 w-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-blue-400">Team Creation</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Build 2-man and 3-man teams with strategic roster management
              </p>
            </div>
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <Crown className="h-6 w-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-purple-400">Captain System</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Assign captains with special privileges and responsibilities
              </p>
            </div>
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-6 w-6 text-green-400" />
                <h3 className="text-lg font-semibold text-green-400">Roster Management</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Add players, manage substitutes, and track team statistics
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-blue-900/20 border border-blue-700 rounded">
            <h4 className="font-semibold text-blue-400 mb-2">Coming Features</h4>
            <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Player recruitment</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Team formations</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                <span>Captain privileges</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Team statistics</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">
              Team management tools will be available in a future update. Stay tuned!
            </p>
            <Button 
              disabled 
              className="bg-gray-700 text-gray-500 cursor-not-allowed"
              data-testid="button-team-mgmt-coming-soon"
            >
              <Lock className="mr-2 h-4 w-4" />
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}