'use client'

import Link from 'next/link'
import { Store, ArrowLeft } from 'lucide-react'

export default function RestaurantNotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Store className="w-10 h-10 text-emerald-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Restaurante nao encontrado
                </h1>

                <p className="text-gray-500 mb-8">
                    O endereco que voce acessou nao corresponde a nenhum restaurante ativo.
                    Verifique se digitou corretamente ou crie o seu proprio!
                </p>

                <div className="space-y-3">
                    <Link
                        href="/"
                        className="block w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                    >
                        Ver restaurantes no Foodie
                    </Link>

                    <Link
                        href="/register"
                        className="block w-full py-3 border border-emerald-200 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
                    >
                        Criar meu restaurante
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mt-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>
                </div>
            </div>
        </div>
    )
}
