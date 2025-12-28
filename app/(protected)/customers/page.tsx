'use client'

import { useSearchParams } from 'next/navigation'
import CustomerDetailPage from './detail'
import CustomersPage from '.'


export default function ProductsPage() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    // TANPA id → LIST
    if (!id) {
        return <CustomersPage />
    }

    // DENGAN id → DETAIL
    return <CustomerDetailPage id={id} />
}