'use client'

import { useSearchParams } from 'next/navigation'
import ProductRequestDetailPage from './detail'
import ProductRequestsPage from '.'


export default function ProductsPage() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    // TANPA id → LIST
    if (!id) {
        return <ProductRequestsPage />
    }

    // DENGAN id → DETAIL
    return <ProductRequestDetailPage id={id} />
}