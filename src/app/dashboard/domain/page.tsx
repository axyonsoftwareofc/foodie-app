'use client'

import { useState } from 'react'
import { Globe, Copy, ExternalLink, Info } from 'lucide-react'
import { toast } from 'sonner'

export default function DomainPage() {
    const [customDomain, setCustomDomain] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)

    const currentSubdomain = typeof window !== 'undefined'
        ? `${window.location.hostname.replace('www.', '').split('.')[0]}.foodie.app`
        : ''

    const handleVerify = async () => {
        if (!customDomain) {
            toast.error('Informe um dominio')
            return
        }
        setIsVerifying(true)
        setTimeout(() => {
            setIsVerifying(false)
            toast.info('Verificacao de DNS em desenvolvimento. Configure um registro CNAME apontando para foodie.app.')
        }, 2000)
    }

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Dominio</h1>
            <p className="text-gray-500 mb-8">Configure seu endereco personalizado na web</p>

            <div className="space-y-6">
                {/* Current Subdomain */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-emerald-600" />
                        Endereco atual
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                        <code className="flex-1 px-4 py-2.5 bg-gray-50 rounded-lg text-emerald-700 font-medium text-sm">
                            {currentSubdomain || 'restaurante.foodie.app'}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(currentSubdomain)
                                toast.success('Copiado!')
                            }}
                            className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                        <a
                            href={`https://${currentSubdomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <ExternalLink className="w-4 h-4 text-gray-500" />
                        </a>
                    </div>
                </section>

                {/* Custom Domain */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-900 mb-2">Dominio proprio</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Use seu proprio dominio (ex: pizzariadoze.com.br)
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-gray-400">https://</span>
                        <input
                            type="text"
                            value={customDomain}
                            onChange={(e) => setCustomDomain(e.target.value)}
                            placeholder="meusite.com.br"
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                        />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <p className="font-medium mb-1">Como configurar:</p>
                            <ol className="list-decimal list-inside space-y-1 text-amber-700">
                                <li>Acesse o painel DNS do seu provedor de dominio</li>
                                <li>Crie um registro <strong>CNAME</strong> apontando para <code className="bg-amber-100 px-1 rounded">foodie.app</code></li>
                                <li>Aguarde a propagacao DNS (ate 48h)</li>
                                <li>Volte aqui e clique em Verificar</li>
                            </ol>
                        </div>
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                        {isVerifying ? 'Verificando...' : 'Verificar Dominio'}
                    </button>

                    <p className="text-xs text-gray-400 text-center mt-3">
                        Disponivel no plano Pro e Enterprise
                    </p>
                </section>
            </div>
        </div>
    )
}
