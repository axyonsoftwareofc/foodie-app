// src/app/page.tsx
import HomePageClient from '@/components/home/HomePageClient';
import { getPublicRestaurants } from '@/actions/restaurantActions';
import { restaurants as mockRestaurants } from '@/data/mock';

export default async function HomePage() {
  const result = await getPublicRestaurants();
  const initialRestaurants = result.data ?? mockRestaurants;

  return <HomePageClient initialRestaurants={initialRestaurants} />;
}
