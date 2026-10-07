import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("../src/db/postgres.js", () => ({
  pool: {
    query: queryMock,
  },
}));

import { dataStore } from "../src/tools/dataStore.js";

describe("dataStore", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("returns sales records", async () => {
    const rows = [
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
    ];

    queryMock.mockResolvedValue({
      rows,
    });

    const result = await dataStore.execute({
      table: "sales",
      limit: 20,
    });

    expect(result).toEqual(rows);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "SELECT id, product, amount, quantity, region",
      ),
      [20],
    );
  });

  it("passes the requested limit to PostgreSQL", async () => {
    queryMock.mockResolvedValue({
      rows: [],
    });

    await dataStore.execute({
      table: "sales",
      limit: 5,
    });

    expect(queryMock).toHaveBeenCalledWith(
      expect.any(String),
      [5],
    );
  });

  it("returns an empty array when there are no records", async () => {
    queryMock.mockResolvedValue({
      rows: [],
    });

    const result = await dataStore.execute({
      table: "sales",
      limit: 20,
    });

    expect(result).toEqual([]);
  });

  it("propagates database errors", async () => {
    queryMock.mockRejectedValue(
      new Error("Database connection failed"),
    );

    await expect(
      dataStore.execute({
        table: "sales",
        limit: 20,
      }),
    ).rejects.toThrow("Database connection failed");
  });
});