// src/components/layout/UserMenu.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, LogOut, MapPin, ClipboardList, Heart, ChevronDown, Store } from 'lucide-react'
import { signOut } from '@/actions/auth'

interface UserMenuProps {
    userName: string;
    userEmail: string;
    userAvatar?: string;
    isRestaurantOwner?: boolean;
}

export function UserMenu({ userName, userEmail, userAvatar, isRestaurantOwner }: UserMenuProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [isSigningOut, setIsSigningOut] = useState<boolean>(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Close on Escape
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [])

    const handleToggle = (): void => {
        setIsOpen((prev) => !prev)
    }

    const handleNavigate = (path: string): void => {
        setIsOpen(false)
        router.push(path)
    }

    const handleSignOut = async (): Promise<void> => {
        setIsOpen(false)
        setIsSigningOut(true)
        await signOut()
        // Force a full page reload to clear all client state
        window.location.href = '/'
    }

    const menuItems = [
        ...(isRestaurantOwner
            ? [{ icon: Store, label: 'Meu Restaurante', path: '/dashboard' }]
            : [{ icon: Store, label: 'Criar Restaurante', path: '/criar-restaurante' }]
        ),
        { icon: User, label: 'Meu perfil', path: '/profile' },
        { icon: ClipboardList, label: 'Meus pedidos', path: '/orders' },
        { icon: Heart, label: 'Favoritos', path: '/favorites' },
        { icon: MapPin, label: 'Endereços', path: '/addresses' },
    ]

    const displayName = userName || userEmail.split('@')[0]
    const initials = displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    // Show loading state while signing out
    if (isSigningOut) {
        return (
            <div
                className="flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            >
                <div
                    className="h-9 w-9 animate-spin rounded-full border-2 border-t-transparent"
                    style={{ borderColor: 'var(--color-border)', borderTopColor: 'transparent' }}
                />
                <span
                    className="hidden text-sm md:block"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    Saindo...
                </span>
            </div>
        )
    }

    return (
        <div ref={menuRef} className="relative">
            {/* Trigger Button */}
            <button
                onClick={handleToggle}
                className="flex items-center gap-2 rounded-full p-1.5 pr-3 transition-colors"
                style={{
                    backgroundColor: isOpen
                        ? 'var(--color-bg-hover)'
                        : 'var(--color-bg-secondary)',
                }}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {/* Avatar */}
                {userAvatar ? (
                    <img
                        src={userAvatar}
                        alt={displayName}
                        className="h-9 w-9 rounded-full object-cover"
                    />
                ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00A082] text-xs font-bold text-white">
                        {initials}
                    </div>
                )}

                {/* Name (desktop only) */}
                <span
                    className="hidden text-sm font-medium md:block"
                    style={{ color: 'var(--color-text)' }}
                >
                    {displayName.split(' ')[0]}
                </span>

                <ChevronDown
                    size={14}
                    className="hidden transition-transform md:block"
                    style={{
                        color: 'var(--color-text-secondary)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl"
                        style={{
                            backgroundColor: 'var(--color-bg-card)',
                            boxShadow: 'var(--shadow-lg)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: 'var(--color-border)',
                        }}
                    >
                        {/* User Info */}
                        <div
                            className="px-4 py-3"
                            style={{
                                borderBottomWidth: '1px',
                                borderBottomStyle: 'solid',
                                borderBottomColor: 'var(--color-border)',
                            }}
                        >
                            <p
                                className="text-sm font-semibold"
                                style={{ color: 'var(--color-text)' }}
                            >
                                {displayName}
                            </p>
                            <p
                                className="text-xs"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                {userEmail}
                            </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => handleNavigate(item.path)}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                    style={{ color: 'var(--color-text)' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            'var(--color-bg-hover)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                >
                                    <item.icon
                                        size={16}
                                        style={{ color: 'var(--color-text-secondary)' }}
                                    />
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Sign Out */}
                        <div
                            className="py-1"
                            style={{
                                borderTopWidth: '1px',
                                borderTopStyle: 'solid',
                                borderTopColor: 'var(--color-border)',
                            }}
                        >
                            <button
                                onClick={handleSignOut}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                style={{ color: 'var(--color-error)' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        'var(--color-bg-hover)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                <LogOut size={16} />
                                Sair
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}