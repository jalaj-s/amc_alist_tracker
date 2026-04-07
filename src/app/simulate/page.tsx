import { SimulatorForm } from "@/components/simulator-form";

export default function SimulatePage() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Would A-List save you money?</h1>
        <p className="text-gray-500 text-sm mt-1">Quick calculator — no account needed</p>
      </div>
      <SimulatorForm />
    </div>
  );
}
