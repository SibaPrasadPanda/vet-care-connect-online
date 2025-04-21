
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const Appointments = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <p>Your upcoming and past appointments will appear here.</p>
      </div>
    </DashboardLayout>
  );
};

export default Appointments;
