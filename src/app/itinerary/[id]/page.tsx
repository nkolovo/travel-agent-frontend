"use client";

import { Suspense, use } from 'react';
import ItineraryPage from '../itineraryPage';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ItineraryPage id={id} />
    </Suspense>
  );
}