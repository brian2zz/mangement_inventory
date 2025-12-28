'use client'

import { useSearchParams } from 'next/navigation'
import OutgoingProductsPage from '.'
import OutgoingEditPage from './detail'


export default function ProductsPage() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    // TANPA id → LIST
    if (!id) {
        return <OutgoingProductsPage />
    }

    // DENGAN id → DETAIL
    return <OutgoingEditPage id={id} />
}