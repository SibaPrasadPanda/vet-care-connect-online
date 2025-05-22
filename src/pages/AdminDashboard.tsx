
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, MessageSquare, Activity, AlertCircle } from 'lucide-react';
import { AssignmentModal } from '@/components/AssignmentModal';

export const AdminDashboard = () => {
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  
  return (
    <div className="grid gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">System Overview</h2>
        <Button 
          onClick={() => setIsAssignmentModalOpen(true)}
          className="bg-vet-primary hover:bg-vet-dark"
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          Assign to Doctors
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,451</div>
            <p className="text-xs text-muted-foreground">
              +145 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Consultations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-muted-foreground">
              +22% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Field Visits Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">
              Across 12 agents
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-xl font-semibold mt-6 mb-4">System Overview</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Breakdown of user types in the system</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              [User Distribution Chart]
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Consultation Volume</CardTitle>
            <CardDescription>Last 30 days of activity</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              [Consultation Activity Chart]
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-center mt-4 gap-4">
        <Button asChild variant="outline">
          <Link to="/reports">
            View Reports
          </Link>
        </Button>
        <Button asChild variant="default" className="bg-vet-primary hover:bg-vet-dark">
          <Link to="/settings">
            System Settings
          </Link>
        </Button>
      </div>

      <AssignmentModal 
        open={isAssignmentModalOpen} 
        onClose={() => setIsAssignmentModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
};

export default AdminDashboard;
