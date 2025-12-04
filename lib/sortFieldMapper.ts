/**
 * Helper untuk mapping sortField dari frontend ke Prisma orderBy
 * 
 * @param entity string - nama entity, misalnya "category", "product", "supplier"
 * @param sortField string - nama kolom dari frontend
 * @param sortOrder "asc" | "desc" - arah urutan
 * @returns object - objek orderBy valid untuk Prisma
 */

export function getOrderBy(
    entity: string,
    sortField: string,
    sortOrder: "asc" | "desc"
): Record<string, any> {
    const maps: Record<
        string,
        Record<
            string,
            string | { relation: string; type: "count" }
        >
    > = {
        // 🧱 Entity: Category
        category: {
            id: "id",
            categoryName: "name",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
            productCount: { relation: "products", type: "count" },
        },

        // 📦 Entity: Product
        product: {
            id: "id",
            name: "name",
            stock: "stock",
            unitPrice: "unitPrice",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
            supplierName: { relation: "supplier", type: "name" }, // contoh advanced
        },

        // 👥 Entity: Customer
        customer: {
            id: "id",
            name: "name",
            phone: "phone",
            email: "email",
            address: "address",
            status: "status",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    };

    const entityMap = maps[entity];
    if (!entityMap) {
        console.warn(`⚠️ No mapping found for entity "${entity}". Defaulting to id`);
        return { id: sortOrder };
    }

    const mapped = entityMap[sortField];

    // ✅ Jika mapping tidak ditemukan, fallback ke "id"
    if (!mapped) {
        console.warn(`⚠️ Unknown sort field "${sortField}" for entity "${entity}".`);
        return { id: sortOrder };
    }

    // 🔢 Jika mapping adalah relasi count
    if (typeof mapped === "object" && mapped.type === "count") {
        return { [mapped.relation]: { _count: sortOrder } };
    }

    // 🧾 Mapping biasa (string field)
    return { [mapped as string]: sortOrder };
}
