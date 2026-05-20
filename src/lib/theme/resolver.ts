export interface RestaurantTheme {
    primaryColor: string
    primaryColorHover: string
    backgroundColor: string
    cardBackgroundColor: string
    textColor: string
    textSecondaryColor: string
    fontHeading: string
    fontBody: string
    borderRadius: string
}

export function getCssVariables(theme: Partial<RestaurantTheme>): Record<string, string> {
    return {
        '--restaurant-primary': theme.primaryColor || '#00A082',
        '--restaurant-primary-hover': theme.primaryColorHover || '#008F74',
        '--restaurant-bg': theme.backgroundColor || '#F9FAFB',
        '--restaurant-card-bg': theme.cardBackgroundColor || '#FFFFFF',
        '--restaurant-text': theme.textColor || '#111827',
        '--restaurant-text-secondary': theme.textSecondaryColor || '#6B7280',
        '--restaurant-font-heading': theme.fontHeading || 'Inter, sans-serif',
        '--restaurant-font-body': theme.fontBody || 'Inter, sans-serif',
        '--restaurant-radius': theme.borderRadius || '12px',
    }
}

export const DEFAULT_THEME: RestaurantTheme = {
    primaryColor: '#00A082',
    primaryColorHover: '#008F74',
    backgroundColor: '#F9FAFB',
    cardBackgroundColor: '#FFFFFF',
    textColor: '#111827',
    textSecondaryColor: '#6B7280',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    borderRadius: '12px',
}

export const FONT_OPTIONS = [
    { value: 'Inter', label: 'Inter (Padrao)' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'Montserrat', label: 'Montserrat' },
]

export const PRESET_THEMES: { name: string; theme: Partial<RestaurantTheme> }[] = [
    {
        name: 'Padrao Foodie',
        theme: { primaryColor: '#00A082', primaryColorHover: '#008F74' },
    },
    {
        name: 'Escuro Elegante',
        theme: {
            primaryColor: '#1A1A1A',
            primaryColorHover: '#333333',
            backgroundColor: '#0F0F0F',
            cardBackgroundColor: '#1A1A1A',
            textColor: '#FFFFFF',
            textSecondaryColor: '#9CA3AF',
        },
    },
    {
        name: 'Vibrante',
        theme: { primaryColor: '#DC2626', primaryColorHover: '#B91C1C' },
    },
    {
        name: 'Azul Corporativo',
        theme: { primaryColor: '#2563EB', primaryColorHover: '#1D4ED8' },
    },
    {
        name: 'Natureza',
        theme: { primaryColor: '#16A34A', primaryColorHover: '#15803D' },
    },
    {
        name: 'Roxo Criativo',
        theme: { primaryColor: '#8B5CF6', primaryColorHover: '#7C3AED' },
    },
]

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const match = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    if (!match) return null
    return {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
    }
}
