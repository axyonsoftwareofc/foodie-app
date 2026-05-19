// src/actions/productActions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import {
    getCurrentUser,
    getOwnedCategory,
    getOwnedProduct,
    userOwnsRestaurant,
} from '@/lib/authz'

const productBadgeSchema = z.enum(['vegetarian', 'vegan', 'gluten_free', 'spicy', 'popular', 'new', 'discount'])

const productSchema = z.object({
    restaurantId: z.string().optional(),
    categoryId: z.string().min(1, 'ID de categoria é obrigatório'),
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().optional(),
    price: z.number().min(0, 'Preço deve ser positivo'),
    image: z.string().optional(),
    isActive: z.boolean().optional().default(true),
    isAvailable: z.boolean().optional().default(true),
    badges: z.array(productBadgeSchema).optional().default([]),
    options: z.unknown().optional(),
    preparationTime: z.number().int().min(1).optional(),
    calories: z.number().int().min(0).optional(),
})

function parsePrice(value: FormDataEntryValue | null): number {
    if (!value) return 0
    const stringValue = typeof value === 'string' ? value : value.toString()
    return parseFloat(stringValue.replace(',', '.'))
}

function parseNumber(value: FormDataEntryValue | null): number | undefined {
    if (!value) return undefined
    const stringValue = typeof value === 'string' ? value : value.toString()
    const num = Number(stringValue)
    return isNaN(num) ? undefined : num
}

function parseJsonField(value: FormDataEntryValue | null): unknown {
    if (!value || typeof value !== 'string') return undefined
    try {
        return JSON.parse(value)
    } catch {
        return undefined
    }
}

export async function getProducts(restaurantId: string, categoryId?: string) {
    try {
        const products = await prisma.product.findMany({
            where: {
                restaurant_id: restaurantId,
                is_active: true,
                ...(categoryId && { category_id: categoryId }),
            },
            orderBy: {
                name: 'asc',
            },
        })

        return { products, error: null }
    } catch (error) {
        console.error('Error fetching products:', error)
        return { error: 'Erro ao buscar produtos', products: [] }
    }
}

export async function getProduct(productId: string) {
    try {
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                is_active: true,
            },
        })

        if (!product) {
            return { error: 'Produto não encontrado', product: null }
        }

        return { product, error: null }
    } catch (error) {
        console.error('Error fetching product:', error)
        return { error: 'Erro ao buscar produto', product: null }
    }
}

export async function getAvailableProducts(restaurantId: string) {
    try {
        const products = await prisma.product.findMany({
            where: {
                restaurant_id: restaurantId,
                is_active: true,
                is_available: true,
            },
            orderBy: {
                name: 'asc',
            },
        })

        return { products, error: null }
    } catch (error) {
        console.error('Error fetching products:', error)
        return { error: 'Erro ao buscar produtos', products: [] }
    }
}

export async function searchProducts(restaurantId: string, searchTerm: string) {
    try {
        const products = await prisma.product.findMany({
            where: {
                restaurant_id: restaurantId,
                is_active: true,
                name: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
            },
            orderBy: {
                name: 'asc',
            },
        })

        return { products, error: null }
    } catch (error) {
        console.error('Error searching products:', error)
        return { error: 'Erro ao buscar produtos', products: [] }
    }
}

export async function createProduct(formData: FormData) {
    try {
        const { user, error: authError } = await getCurrentUser()
        if (authError || !user) {
            return { error: authError || 'Usuário não autenticado' }
        }

        const data = {
            restaurantId: (formData.get('restaurantId') as string) || undefined,
            categoryId: formData.get('categoryId') as string,
            name: formData.get('name') as string,
            description: (formData.get('description') as string) || undefined,
            price: parsePrice(formData.get('price')),
            image: (formData.get('image') as string) || undefined,
            isActive: true,
            isAvailable: formData.get('isAvailable') !== 'false',
            badges: (parseJsonField(formData.get('badges')) as z.infer<typeof productBadgeSchema>[]) || [],
            options: parseJsonField(formData.get('options')),
            preparationTime: parseNumber(formData.get('preparationTime')),
            calories: parseNumber(formData.get('calories')),
        }

        const result = productSchema.safeParse(data)

        if (!result.success) {
            return { error: result.error.issues[0].message }
        }

        const category = await getOwnedCategory(user.id, result.data.categoryId)
        if (!category) {
            return { error: 'Não autorizado ou categoria não encontrada' }
        }

        const restaurantId = result.data.restaurantId || category.restaurant_id
        if (restaurantId !== category.restaurant_id || !(await userOwnsRestaurant(user.id, restaurantId))) {
            return { error: 'Não autorizado ou restaurante não encontrado' }
        }

        const product = await prisma.product.create({
            data: {
                restaurant_id: restaurantId,
                category_id: category.id,
                name: result.data.name,
                description: result.data.description,
                price: result.data.price,
                image: result.data.image || '',
                is_active: result.data.isActive,
                is_available: result.data.isAvailable,
                badges: result.data.badges,
                options: result.data.options as Prisma.InputJsonValue,
                preparation_time: result.data.preparationTime,
                calories: result.data.calories,
            },
        })

        revalidatePath('/dashboard/menu')
        return { product, success: true }
    } catch (error) {
        console.error('Error creating product:', error)
        return { error: 'Erro ao criar produto' }
    }
}

export async function updateProduct(productId: string, formData: FormData) {
    try {
        const { user, error: authError } = await getCurrentUser()
        if (authError || !user) {
            return { error: authError || 'Usuário não autenticado' }
        }

        const productOwner = await getOwnedProduct(user.id, productId)
        if (!productOwner) {
            return { error: 'Não autorizado ou produto não encontrado' }
        }

        const nextCategoryId = formData.get('categoryId') as string | null
        let categoryId = productOwner.category_id
        if (nextCategoryId) {
            const category = await getOwnedCategory(user.id, nextCategoryId)
            if (!category || category.restaurant_id !== productOwner.restaurant_id) {
                return { error: 'Categoria inválida para este restaurante' }
            }
            categoryId = category.id
        }

        const data = {
            name: formData.get('name') as string,
            description: (formData.get('description') as string) || null,
            price: parsePrice(formData.get('price')),
            image: (formData.get('image') as string) || null,
            category_id: categoryId,
            is_active: formData.get('isActive') !== 'false',
            is_available: formData.get('isAvailable') !== 'false',
            badges: (parseJsonField(formData.get('badges')) as string[]) || [],
            options: parseJsonField(formData.get('options')) as Prisma.InputJsonValue,
            preparation_time: parseNumber(formData.get('preparationTime')) || null,
            calories: parseNumber(formData.get('calories')) || null,
        }

        const product = await prisma.product.update({
            where: {
                id: productId,
            },
            data,
        })

        revalidatePath('/dashboard/menu')
        return { product, success: true }
    } catch (error) {
        console.error('Error updating product:', error)
        return { error: 'Erro ao atualizar produto' }
    }
}

export async function toggleProductAvailability(productId: string, isAvailable: boolean) {
    try {
        const { user, error: authError } = await getCurrentUser()
        if (authError || !user) {
            return { error: authError || 'Usuário não autenticado' }
        }

        const productOwner = await getOwnedProduct(user.id, productId)
        if (!productOwner) {
            return { error: 'Não autorizado ou produto não encontrado' }
        }

        await prisma.product.update({
            where: {
                id: productId,
            },
            data: {
                is_available: isAvailable,
            },
        })

        revalidatePath('/dashboard/menu')
        return { success: true }
    } catch (error) {
        console.error('Error toggling availability:', error)
        return { error: 'Erro ao atualizar disponibilidade' }
    }
}

export async function deleteProduct(productId: string) {
    try {
        const { user, error: authError } = await getCurrentUser()
        if (authError || !user) {
            return { error: authError || 'Usuário não autenticado' }
        }

        const productOwner = await getOwnedProduct(user.id, productId)
        if (!productOwner) {
            return { error: 'Não autorizado ou produto não encontrado' }
        }

        await prisma.product.update({
            where: {
                id: productId,
            },
            data: {
                is_active: false,
            },
        })

        revalidatePath('/dashboard/menu')
        return { success: true }
    } catch (error) {
        console.error('Error deleting product:', error)
        return { error: 'Erro ao excluir produto' }
    }
}
