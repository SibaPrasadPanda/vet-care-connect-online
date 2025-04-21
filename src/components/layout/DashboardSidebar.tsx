
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  FileText,
  ClipboardList,
  MapPin,
  Settings,
  UserCircle,
  PawPrint
} from 'lucide-react';

export const DashboardSidebar = () => {
  const { user } = useAuth();
  
  // Define menu items based on role
  const getMenuItems = () => {
    const baseItems = [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Profile',
        url: '/profile',
        icon: UserCircle,
      },
    ];
    
    // Patient specific items
    const patientItems = [
      {
        title: 'My Pets',
        url: '/pets',
        icon: PawPrint,
      },
      {
        title: 'Consultations',
        url: '/consultations',
        icon: MessageSquare,
      },
      {
        title: 'Prescriptions',
        url: '/prescriptions',
        icon: FileText,
      },
      {
        title: 'Appointments',
        url: '/appointments',
        icon: Calendar,
      },
    ];
    
    // Doctor specific items
    const doctorItems = [
      {
        title: 'My Schedule',
        url: '/schedule',
        icon: Calendar,
      },
      {
        title: 'Patient Cases',
        url: '/cases',
        icon: ClipboardList,
      },
      {
        title: 'Write Prescriptions',
        url: '/write-prescription',
        icon: FileText,
      },
    ];
    
    // Agent specific items
    const agentItems = [
      {
        title: 'Field Visits',
        url: '/visits',
        icon: MapPin,
      },
      {
        title: 'My Schedule',
        url: '/schedule',
        icon: Calendar,
      },
    ];
    
    // Admin specific items
    const adminItems = [
      {
        title: 'User Management',
        url: '/users',
        icon: Users,
      },
      {
        title: 'System Settings',
        url: '/settings',
        icon: Settings,
      },
    ];
    
    // Return appropriate items for the current user role
    switch(user?.role) {
      case 'patient':
        return [...baseItems, ...patientItems];
      case 'doctor':
        return [...baseItems, ...doctorItems];
      case 'agent':
        return [...baseItems, ...agentItems];
      case 'admin':
        return [...baseItems, ...adminItems];
      default:
        return baseItems;
    }
  };

  const items = getMenuItems();

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center px-4 py-2">
        <PawPrint className="text-vet-primary h-6 w-6 mr-2" />
        <span className="text-lg font-medium">VetCare</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
