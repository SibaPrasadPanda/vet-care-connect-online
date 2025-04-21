
import { ReactNode } from 'react';
import { Header } from './Header';
import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from './DashboardSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen">
      <Header />
      <SidebarProvider>
        <div className="min-h-[calc(100vh-4rem)] flex w-full">
          <DashboardSidebar />
          <div className="flex-1 p-6">
            <div className="container">
              {children}
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};
