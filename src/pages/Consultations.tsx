
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const Consultations = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Consultations</h1>
        <p>Your consultation history and upcoming consultations will appear here.</p>
      </div>
    </DashboardLayout>
  );
};

export default Consultations;
