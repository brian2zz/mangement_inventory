import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ---------------------------
   DATE FORMATTER: dd-MM-yyyy
---------------------------- */
function formatDate(date: Date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

/* ---------------------------
   PARSE dd-MM-yyyy OR yyyy-MM-dd
---------------------------- */
function parseDate(value: string) {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(value);

  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split("-").map(Number);
    return new Date(yyyy, mm - 1, dd);
  }

  return null;
}

/* ---------------------------
   FILTER HANDLER
---------------------------- */
function buildFilterWhere(filters: any[]) {
  if (!Array.isArray(filters)) return {};

  const opMap: any = {
    "=": "equals",
    contains: "contains",
    ">": "gt",
    "<": "lt",
    ">=": "gte",
    "<=": "lte",
  };

  return {
    AND: filters
      .map((f) => {
        const { field, operator, value } = f;
        const op = opMap[operator];
        if (!op) return null;

        if (field === "requestDate") {
          const parsed = parseDate(value);
          if (!parsed) return null;
          return { requestDate: { [op]: parsed } };
        }

        if (field === "store") {
          return { store: { contains: value } };
        }

        if (field === "supplier") {
          return { supplier: { contains: value } };
        }

        return null;
      })
      .filter(Boolean),
  };
}

/* ---------------------------
   APPLY SORT ORDER
---------------------------- */
function applySortOrder(obj: any, sortOrder: "asc" | "desc"): any {
  const key = Object.keys(obj)[0];
  const val = obj[key];
  if (val === undefined) return { [key]: sortOrder };

  return { [key]: applySortOrder(val, sortOrder) };
}

/* ---------------------------
         API GET ROUTE
---------------------------- */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const search = searchParams.get("search") ?? "";
    const sortField = searchParams.get("sortField") ?? "requestDate";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const skip = (page - 1) * limit;

    // Allowed sort fields
    const safeSortFields = {
      requestedItem: { requestedItem: undefined },
      requestedQuantity: { requestedQuantity: undefined },
      fulfilledQuantity: { fulfilledQuantity: undefined },
      requestDate: { requestDate: undefined },
      fulfilledDate: { fulfilledDate: undefined },
      store: { store: undefined },
      unitPrice: { unitPrice: undefined },
      totalPrice: { totalPrice: undefined },
      supplier: { supplier: undefined },
    };

    const sortConfig =
      safeSortFields[sortField as keyof typeof safeSortFields] ??
      safeSortFields.requestDate;

    const orderBy = applySortOrder(sortConfig, sortOrder);

    // FILTERS
    let filterWhere = {};
    const rawFilters = searchParams.get("filters");

    if (rawFilters) {
      try {
        filterWhere = buildFilterWhere(JSON.parse(rawFilters));
      } catch {}
    }

    // BASIC SEARCH
    const searchWhere =
      search.trim() === ""
        ? {}
        : {
            OR: [
              { requestedItem: { contains: search } },
              { store: { contains: search } },
              { supplier: { contains: search } },
            ],
          };

    const where = { AND: [filterWhere, searchWhere] };

    // QUERY
    const [totalCount, rows] = await Promise.all([
      prisma.productRequest.count({ where }),

      prisma.productRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    // MAP RESPONSE
    const data = rows.map((item) => ({
      id: item.id,
      requestedItem: item.requestedItem,
      requestedQuantity: item.requestedQuantity,
      fulfilledQuantity: item.fulfilledQuantity,
      requestDate: formatDate(item.requestDate),
      fulfilledDate: item.fulfilledDate ? formatDate(item.fulfilledDate) : "-",
      store: item.store,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      remarks: item.notes ?? "",
      supplierLocation: item.supplier ?? "-",
    }));

    return NextResponse.json({
      success: true,
      data,
      totalCount,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("❌ REQUEST REPORT ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
