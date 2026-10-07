import { describe, expect, it } from "vitest";
import { dataProcessor } from "../src/tools/dataProcessor.js";

const sales = [
  {
    id: 1,
    product: "Laptop",
    amount: 85000,
    quantity: 2,
    region: "North",
  },
  {
    id: 2,
    product: "Monitor",
    amount: 25000,
    quantity: 5,
    region: "South",
  },
  {
    id: 3,
    product: "Keyboard",
    amount: 5000,
    quantity: 10,
    region: "North",
  },
];

describe("dataProcessor", () => {
  it("counts records", async () => {
    const result = await dataProcessor.execute({
      data: sales,
      operation: "count",
    });

    expect(result).toBe(3);
  });

  it("calculates the sum of a numeric field", async () => {
    const result = await dataProcessor.execute({
      data: sales,
      operation: "sum",
      field: "amount",
    });

    expect(result).toBe(115000);
  });

  it("calculates the average of a numeric field", async () => {
    const result = await dataProcessor.execute({
      data: sales,
      operation: "average",
      field: "amount",
    });

    expect(result).toBeCloseTo(38333.3333, 4);
  });

  it("returns zero for average of empty data", async () => {
    const result = await dataProcessor.execute({
      data: [],
      operation: "average",
      field: "amount",
    });

    expect(result).toBe(0);
  });

  it("requires a field for sum", async () => {
    await expect(
      dataProcessor.execute({
        data: sales,
        operation: "sum",
      }),
    ).rejects.toThrow("field is required for sum operation");
  });

  it("requires a field for average", async () => {
    await expect(
      dataProcessor.execute({
        data: sales,
        operation: "average",
      }),
    ).rejects.toThrow("field is required for average operation");
  });

  it("rejects non-numeric values for sum", async () => {
    await expect(
      dataProcessor.execute({
        data: [
          {
            id: 1,
            product: "Laptop",
            amount: "85000",
            quantity: 2,
            region: "North",
          },
        ],
        operation: "sum",
        field: "amount",
      }),
    ).rejects.toThrow('Field "amount" must contain numeric values');
  });

  it("rejects non-numeric values for average", async () => {
    await expect(
      dataProcessor.execute({
        data: [
          {
            id: 1,
            product: "Laptop",
            amount: "85000",
            quantity: 2,
            region: "North",
          },
        ],
        operation: "average",
        field: "amount",
      }),
    ).rejects.toThrow('Field "amount" must contain numeric values');
  });
});