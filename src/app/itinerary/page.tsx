"use client";

export const dynamic = "force-dynamic";

import { Suspense } from 'react';
import ItineraryPageClient from './itineraryPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ItineraryPageClient />
    </Suspense >
  );
}
