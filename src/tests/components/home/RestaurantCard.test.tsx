// src/tests/components/home/RestaurantCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../utils/test-utils';
import RestaurantCard from '../../../components/home/RestaurantCard';
import { mockRestaurant } from '../../utils/mock-data';

describe('RestaurantCard', () => {
  it('should render restaurant name', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);

    expect(screen.getByText(mockRestaurant.name)).toBeInTheDocument();
  });

  it('should render rating', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);

    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('should render delivery time', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);

    expect(screen.getByText('30-45 min')).toBeInTheDocument();
  });

  it('should show "Grátis" for free delivery', () => {
    const freeDeliveryRestaurant = { ...mockRestaurant, deliveryFee: 0 };
    render(<RestaurantCard restaurant={freeDeliveryRestaurant} />);

    expect(screen.getByText('Grátis')).toBeInTheDocument();
  });

  it('should show "Entrega Grátis" badge for free delivery', () => {
    const freeDeliveryRestaurant = { ...mockRestaurant, deliveryFee: 0 };
    render(<RestaurantCard restaurant={freeDeliveryRestaurant} />);

    expect(screen.getByText('Entrega Grátis')).toBeInTheDocument();
  });

  it('should show "Patrocinado" badge for promoted', () => {
    const promotedRestaurant = { ...mockRestaurant, promoted: true };
    render(<RestaurantCard restaurant={promotedRestaurant} />);

    expect(screen.getByText('Patrocinado')).toBeInTheDocument();
  });

  it('should link to restaurant page', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/restaurant/${mockRestaurant.id}`);
  });
});
