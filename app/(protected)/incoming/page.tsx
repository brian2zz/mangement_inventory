'use client'

import { useSearchParams } from 'next/navigation'
import IncomingPage from '.'
import IncomingEditPage from './detail'


export default function ProductsPage() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    // TANPA id → LIST
    if (!id) {
        return <IncomingPage />
    }

    // DENGAN id → DETAIL
    return <IncomingEditPage id={id} />
}