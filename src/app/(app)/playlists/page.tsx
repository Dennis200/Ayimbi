
'use client';
// This is just a redirect to the main library page which now handles playlists.
import { redirect } from 'next/navigation';

export default function PlaylistsRedirectPage() {
    redirect('/library');
}
