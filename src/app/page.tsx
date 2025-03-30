"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        router.push('/dashboard');  // Redirect to /Dashboard
    }, [router]);

    return null;  // This will render nothing as it's only for the redirect
}
