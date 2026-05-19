// src/app/api/products/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnedCategory, getOwnedProduct, userOwnsRestaurant } from '@/lib/authz'

const productBadgeSchema = z.enum(['vegetarian', 'vegan', 'gluten_free', 'spicy', 'popular', 'new', 'discount'])

const productSchema = z.object({
    restaurantId: z.string().min(1),
    categoryId: z.string().min(1),
    name: z.string().min(2),
    description: z.string().optional(),
    price: z.number().min(0),
    image: z.string().url().optional(),
    isActive: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
    badges: z.array(productBadgeSchema).optional(),
    options: z.array(z.unknown()).optional(),
    preparationTime: z.number().int().min(1).optional(),
    calories: z.number().int().min(0).optional(),
})

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const restaurantId = searchParams.get('restaurantId')
        const categoryId = searchParams.get('categoryId')
        const productId = searchParams.get('id')
        const available = searchParams.get('available')

        if (productId) {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single()

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 404 })
            }

            return NextResponse.json({ product: data })
        }

        if (!restaurantId) {
            return NextResponse.json({ error: 'ID do restaurante é obrigatório' }, { status: 400 })
        }

        let query = supabase
            .from('products')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('is_active', true)

        if (categoryId) {
            query = query.eq('category_id', categoryId)
        }

        if (available === 'true') {
            query = query.eq('is_available', true)
        }

        const { data, error } = await query.order('name')

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ products: data || [] })
    } catch (error) {
        console.error('GET products error:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        
        const result = productSchema.safeParse(body)
        
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            )
        }

        if (!(await userOwnsRestaurant(user.id, result.data.restaurantId))) {
            return NextResponse.json({ error: 'Não autorizado ou restaurante não encontrado' }, { status: 403 })
        }

        const category = await getOwnedCategory(user.id, result.data.categoryId)
        if (!category || category.restaurant_id !== result.data.restaurantId) {
            return NextResponse.json({ error: 'Categoria inválida para este restaurante' }, { status: 403 })
        }

        const { data, error } = await supabase
            .from('products')
            .insert({
                restaurant_id: result.data.restaurantId,
                category_id: result.data.categoryId,
                name: result.data.name,
                description: result.data.description,
                price: result.data.price,
                image: result.data.image,
                is_active: result.data.isActive ?? true,
                is_available: result.data.isAvailable ?? true,
                badges: result.data.badges || [],
                options: result.data.options || [],
                preparation_time: result.data.preparationTime,
                calories: result.data.calories,
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ product: data, success: true }, { status: 201 })
    } catch (error) {
        console.error('POST product error:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('id')

        if (!productId) {
            return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 })
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()

        const productOwner = await getOwnedProduct(user.id, productId)
        if (!productOwner) {
            return NextResponse.json({ error: 'Não autorizado ou produto não encontrado' }, { status: 403 })
        }

        if (body.categoryId) {
            const category = await getOwnedCategory(user.id, body.categoryId)
            if (!category || category.restaurant_id !== productOwner.restaurant_id) {
                return NextResponse.json({ error: 'Categoria inválida para este restaurante' }, { status: 403 })
            }
        }
        
        const { data, error } = await supabase
            .from('products')
            .update({
                name: body.name,
                description: body.description,
                price: body.price,
                image: body.image,
                category_id: body.categoryId,
                is_active: body.isActive,
                is_available: body.isAvailable,
                badges: body.badges || [],
                options: body.options || [],
                preparation_time: body.preparationTime,
                calories: body.calories,
            })
            .eq('id', productId)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ product: data, success: true })
    } catch (error) {
        console.error('PUT product error:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('id')

        if (!productId) {
            return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 })
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const productOwner = await getOwnedProduct(user.id, productId)
        if (!productOwner) {
            return NextResponse.json({ error: 'Não autorizado ou produto não encontrado' }, { status: 403 })
        }

        const { error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', productId)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE product error:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
