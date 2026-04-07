import { calculateSimulation } from "@/components/simulator-form";

describe("calculateSimulation", () => {
  it("calculates monthly spend for standard format", () => {
    const result = calculateSimulation({ moviesPerMonth: 3, format: "standard", isDiscountDay: false });
    expect(result.monthlySpend).toBeCloseTo(47.97, 2);
  });
  it("calculates savings vs membership", () => {
    const result = calculateSimulation({ moviesPerMonth: 3, format: "standard", isDiscountDay: false });
    expect(result.monthlySavings).toBeCloseTo(47.97 - 25.99, 2);
  });
  it("calculates yearly savings", () => {
    const result = calculateSimulation({ moviesPerMonth: 3, format: "standard", isDiscountDay: false });
    expect(result.yearlySavings).toBeCloseTo((47.97 - 25.99) * 12, 1);
  });
  it("applies discount pricing", () => {
    const result = calculateSimulation({ moviesPerMonth: 3, format: "standard", isDiscountDay: true });
    expect(result.monthlySpend).toBeCloseTo(24.0, 2);
  });
  it("uses mix pricing", () => {
    const result = calculateSimulation({ moviesPerMonth: 1, format: "mix", isDiscountDay: false });
    expect(result.monthlySpend).toBeCloseTo(20.66, 1);
  });
  it("returns negative savings when not worth it", () => {
    const result = calculateSimulation({ moviesPerMonth: 1, format: "standard", isDiscountDay: true });
    expect(result.monthlySavings).toBeLessThan(0);
  });
});
