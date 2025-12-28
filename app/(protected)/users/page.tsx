'use client'

import { useSearchParams } from 'next/navigation'
import UserDetailPage from './detail'
import UsersPage from '.'


export default function ProductsPage() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    // TANPA id → LIST
    if (!id) {
        return <UsersPage />
    }

    // DENGAN id → DETAIL
    return <UserDetailPage id={id} />
}