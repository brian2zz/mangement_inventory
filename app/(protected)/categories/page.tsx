'use client'

import { useSearchParams } from 'next/navigation'
import CategoryDetailPage from './detail'
import CategoriesPage from '.'


export default function ProductsPage() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    // TANPA id → LIST
    if (!id) {
        return <CategoriesPage />
    }

    // DENGAN id → DETAIL
    return <CategoryDetailPage id={id} />
}