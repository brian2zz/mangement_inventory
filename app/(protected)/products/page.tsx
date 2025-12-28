'use client'

import { useSearchParams } from 'next/navigation'
import ProductDetailPage from './detail'
import ProductsPage from '.'


export default function MainPages() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    // TANPA id → LIST
    if (!id) {
        return <ProductsPage />
    }

    // DENGAN id → DETAIL
    return <ProductDetailPage id={id} />
}