'use client'

import { useSearchParams } from 'next/navigation'
import SupplierDetailPage from './detail'
import SuppliersPage from '.'


export default function ProductsPage() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    // TANPA id → LIST
    if (!id) {
        return <SuppliersPage />
    }

    // DENGAN id → DETAIL
    return <SupplierDetailPage id={id} />
}