
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const Pets = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Pets</h1>
        <p>Your pets and their medical records will appear here.</p>
      </div>
    </DashboardLayout>
  );
};

export default Pets;
