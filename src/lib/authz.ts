import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function getCurrentUser(): Promise<{ user?: User; error?: string }> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return { error: 'Usuario nao autenticado' }
    }

    return { user }
}

export async function getUserRestaurant(userId: string) {
    return prisma.restaurant.findFirst({
        where: {
            user_id: userId,
            is_active: true,
        },
        select: { id: true, name: true },
    })
}

export async function userOwnsRestaurant(userId: string, restaurantId: string): Promise<boolean> {
    const restaurant = await prisma.restaurant.findFirst({
        where: {
            id: restaurantId,
            user_id: userId,
            is_active: true,
        },
        select: { id: true },
    })

    return Boolean(restaurant)
}

export async function getOwnedCategory(userId: string, categoryId: string) {
    return prisma.category.findFirst({
        where: {
            id: categoryId,
            restaurant: {
                user_id: userId,
                is_active: true,
            },
        },
        select: {
            id: true,
            restaurant_id: true,
        },
    })
}

export async function getOwnedProduct(userId: string, productId: string) {
    return prisma.product.findFirst({
        where: {
            id: productId,
            restaurant: {
                user_id: userId,
                is_active: true,
            },
        },
        select: {
            id: true,
            restaurant_id: true,
            category_id: true,
        },
    })
}

export async function userOwnsReviewRestaurant(userId: string, reviewId: string): Promise<boolean> {
    const restaurant = await getUserRestaurant(userId)
    if (!restaurant) return false

    const review = await prisma.review.findFirst({
        where: {
            id: reviewId,
            restaurant_id: restaurant.id,
        },
        select: { id: true },
    })

    return Boolean(review)
}

export async function userOwnsTable(userId: string, tableId: string): Promise<boolean> {
    const table = await prisma.restaurantTable.findFirst({
        where: {
            id: tableId,
            restaurant: {
                user_id: userId,
                is_active: true,
            },
        },
        select: { id: true },
    })

    return Boolean(table)
}
