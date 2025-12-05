import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ---------------------------
   DATE FORMATTER (yyyy-MM-dd)
---------------------------- */
function formatDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);
    const search = (searchParams.get("search") ?? "").trim();
    const sortField = searchParams.get("sortField") ?? "date";
    const sortOrderParam = searchParams.get("sortOrder");
    const sortOrder: "asc" | "desc" =
      sortOrderParam === "asc" ? "asc" : "desc";

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const from = fromParam ? new Date(fromParam) : null;
    const to = toParam ? new Date(toParam) : null;

    const skip = (page - 1) * limit;

    /* ----------------------------------------------------
       📌 SUMMARY DATA (REAL DATABASE)
    ---------------------------------------------------- */

    // ambil semua product sekali, lalu hitung summary di JS
    const [allProducts, pendingRequests] = await Promise.all([
      prisma.product.findMany(),
      prisma.productRequest.count({
        where: { status: "Pending" },
      }),
    ]);

    const totalProducts = allProducts.length;

    const lowStockItems = allProducts.filter(
      (p) => p.reorderLevel > 0 && p.stock < p.reorderLevel
    ).length;

    const totalValueNumber = allProducts.reduce((sum, p) => {
      const unit = Number(p.unitPrice ?? 0);
      return sum + p.stock * unit;
    }, 0);

    const summary = {
      totalProducts,
      lowStockItems,
      totalValue: totalValueNumber.toFixed(2),
      pendingRequests,
    };

    /* ----------------------------------------------------
       📌 QUERY REKAP DATA (incoming + outgoing + request)
    ---------------------------------------------------- */

    // filter tanggal
    const dateFilter =
      from && to
        ? {
            gte: from,
            lte: to,
          }
        : undefined;

    // ------- INCOMING -------
    const incomingWhere = dateFilter
      ? {
          incomingTransaction: {
            transactionDate: dateFilter,
          },
        }
      : {};

    const incoming = await prisma.incomingTransactionItem.findMany({
      where: incomingWhere,
      include: {
        product: true,
        incomingTransaction: {
          include: { supplier: true, warehouse: true },
        },
      },
    });

    const mappedIncoming = incoming.map((item) => ({
      id: `in-${item.id}`,
      date: formatDate(item.incomingTransaction.transactionDate),
      partNumber: item.product.partNumber ?? "-",
      productName: item.product.name,
      source: item.incomingTransaction.supplier?.name ?? "-",
      stockIn: item.quantity,
      stockOut: 0,
      destination: item.incomingTransaction.warehouse?.name ?? "-",
      stock: item.product.stock,
      remarks: item.notes ?? "",
    }));

    // ------- OUTGOING -------
    const outgoingWhere = dateFilter
      ? {
          outgoingTransaction: {
            transactionDate: dateFilter,
          },
        }
      : {};

    const outgoing = await prisma.outgoingTransactionItem.findMany({
      where: outgoingWhere,
      include: {
        product: true,
        outgoingTransaction: {
          include: { customer: true, warehouse: true },
        },
      },
    });

    const mappedOutgoing = outgoing.map((item) => ({
      id: `out-${item.id}`,
      date: formatDate(item.outgoingTransaction.transactionDate),
      partNumber: item.product.partNumber ?? "-",
      productName: item.product.name,
      source: item.outgoingTransaction.warehouse?.name ?? "-",
      stockIn: 0,
      stockOut: item.quantity,
      destination:
        item.outgoingTransaction.customer?.name ?? item.destination ?? "-",
      stock: item.product.stock,
      remarks: item.notes ?? "",
    }));

    // ------- REQUEST -------
    const requestWhere = dateFilter
      ? {
          requestDate: dateFilter,
        }
      : {};

    const requests = await prisma.productRequest.findMany({
      where: requestWhere,
    });

    const mappedRequest = requests.map((item) => ({
      id: `req-${item.id}`,
      date: formatDate(item.requestDate),
      partNumber: "-",
      productName: item.requestedItem,
      source: item.store,
      stockIn: item.fulfilledQuantity,
      stockOut: 0,
      destination: item.supplier ?? "-",
      stock: item.fulfilledQuantity,
      remarks: item.notes ?? "",
    }));

    /* ----------------------------------------------------
       📌 COMBINE, SEARCH, SORT, PAGINATE
    ---------------------------------------------------- */

    let rows = [...mappedIncoming, ...mappedOutgoing, ...mappedRequest];

    // SEARCH (sederhana, full-text di row JSON)
    if (search) {
      const lc = search.toLowerCase();
      rows = rows.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(lc)
      );
    }

    const sortableKeys = new Set([
      "date",
      "partNumber",
      "productName",
      "source",
      "stockIn",
      "stockOut",
      "destination",
      "stock",
      "remarks",
    ]);

    if (sortableKeys.has(sortField)) {
      rows.sort((a: any, b: any) => {
        const av = a[sortField];
        const bv = b[sortField];

        if (typeof av === "number" && typeof bv === "number") {
          return av - bv;
        }
        return String(av ?? "").localeCompare(String(bv ?? ""));
      });

      if (sortOrder === "desc") {
        rows.reverse();
      }
    } else {
      // default: sort by date desc
      rows.sort((a, b) => (a.date < b.date ? 1 : -1));
    }

    const totalCount = rows.length;

    // PAGINATE
    rows = rows.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      summary,
      data: rows,
      totalCount,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("❌ DASHBOARD REKAP ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
