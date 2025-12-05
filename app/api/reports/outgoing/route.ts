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

  // yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value);
  }

  // dd-MM-yyyy
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split("-").map(Number);
    return new Date(yyyy, mm - 1, dd);
  }

  return null;
}

/* ---------------------------
   BUILD FILTER
   contoh field:
   - transactionDate
   - customer
   - warehouse
   - category
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

        if (field === "transactionDate") {
          const parsed = parseDate(value);
          if (!parsed) return null;
          return { outgoingTransaction: { transactionDate: { [op]: parsed } } };
        }

        if (field === "customer") {
          return {
            outgoingTransaction: {
              customer: {
                name: {
                  contains: value,
                },
              },
            },
          };
        }

        if (field === "warehouse") {
          return {
            outgoingTransaction: {
              warehouse: {
                name: {
                  contains: value,
                },
              },
            },
          };
        }

        if (field === "category") {
          return {
            product: {
              category: {
                name: {
                  contains: value,
                },
              },
            },
          };
        }

        return null;
      })
      .filter(Boolean),
  };
}

/* ---------------------------
   APPLY SORT ORDER (nested)
---------------------------- */
function applySortOrder(obj: any, sortOrder: "asc" | "desc"): any {
  const key = Object.keys(obj)[0];
  const val = obj[key];

  if (val === undefined) {
    return { [key]: sortOrder };
  }

  return {
    [key]: applySortOrder(val, sortOrder),
  };
}

/* ---------------------------
         API GET LIST
---------------------------- */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const search = searchParams.get("search") ?? "";
    const sortField = searchParams.get("sortField") ?? "date";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const skip = (page - 1) * limit;

    // Allowed sort fields
    const safeSortFields = {
      date: { outgoingTransaction: { transactionDate: undefined } },
      productName: { product: { name: undefined } },
      category: { product: { category: { name: undefined } } },
      partNumber: { product: { partNumber: undefined } },
      source: { outgoingTransaction: { warehouse: { name: undefined } } },
      destination: { destination: undefined },
      quantityOut: { quantity: undefined },
      currentStock: { product: { stock: undefined } },
    } as const;

    const sortConfig =
      safeSortFields[sortField as keyof typeof safeSortFields] ??
      safeSortFields.date;

    const orderBy = applySortOrder(sortConfig, sortOrder);

    // Filters (JSON di query ?filters=[...])
    let filterWhere = {};
    const rawFilters = searchParams.get("filters");

    if (rawFilters) {
      try {
        filterWhere = buildFilterWhere(JSON.parse(rawFilters));
      } catch {
        // abaikan filter invalid
      }
    }

    // SEARCH
    const searchWhere =
      search.trim() === ""
        ? {}
        : {
            OR: [
              { product: { name: { contains: search } } },
              { product: { partNumber: { contains: search } } },
              { product: { category: { name: { contains: search } } } },
              {
                outgoingTransaction: {
                  customer: { name: { contains: search } },
                },
              },
              {
                outgoingTransaction: {
                  warehouse: { name: { contains: search } },
                },
              },
              { outgoingTransaction: { sourceLocation: { contains: search } } },
              { destination: { contains: search } },
            ],
          };

    const where = { AND: [filterWhere, searchWhere] };

    /* ---------------------------
             QUERY DB
    ---------------------------- */

    const [totalCount, rows] = await Promise.all([
      prisma.outgoingTransactionItem.count({ where }),

      prisma.outgoingTransactionItem.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          product: {
            include: { category: true },
          },
          outgoingTransaction: {
            include: {
              warehouse: true,
              customer: true,
            },
          },
        },
      }),
    ]);

    /* ---------------------------
           MAP TO REPORT FORMAT
    ---------------------------- */

    const data = rows.map((item) => ({
      id: item.id,
      date: formatDate(item.outgoingTransaction.transactionDate),
      productName: item.product.name,
      category: item.product.category?.name ?? "-",
      partNumber: item.product.partNumber ?? "-",
      source:
        item.outgoingTransaction.warehouse?.name ??
        item.outgoingTransaction.sourceLocation ??
        "-",
      destination:
        item.destination ??
        item.outgoingTransaction.customer?.name ??
        "-",
      quantityOut: item.quantity,
      currentStock: item.product.stock,
      remarks: item.notes ?? "",
    }));

    return NextResponse.json({
      success: true,
      data,
      totalCount,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("❌ REPORT OUTGOING ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
