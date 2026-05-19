// src/hooks/useViaCep.ts
'use client'

import { useState, useCallback } from 'react'

export interface CepResponse {
    cep: string
    logradouro: string
    complemento: string
    bairro: string
    localidade: string
    uf: string
    erro?: boolean
}

export function useViaCep() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchAddress = useCallback(async (cep: string): Promise<CepResponse | null> => {
        const cleanCep = cep.replace(/\D/g, '')

        if (cleanCep.length !== 8) {
            setError('CEP deve ter 8 dígitos')
            return null
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
            const data: CepResponse = await response.json()

            if (data.erro) {
                setError('CEP não encontrado')
                return null
            }

            return data
        } catch (err) {
            setError('Erro ao consultar CEP')
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        fetchAddress,
        loading,
        error,
        clearError: () => setError(null)
    }
}