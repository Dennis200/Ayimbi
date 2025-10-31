
'use client';
import { useMemo, useEffect, useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { User, Song } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2, Download, Play, BadgeCheck } from 'lucide-react';

interface CreatorStats {
  totalPlays: number;
  totalDownloads: number;
}

const CreatorCard = ({ creator }: { creator: User }) => {
  const firestore = useFirestore();
  const [stats, setStats] = useState<CreatorStats>({ totalPlays: 0, totalDownloads: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchCreatorStats = async () => {
      setLoadingStats(true);
      const songsQuery = query(collection(firestore, 'songs'), where('artistId', '==', creator.id));
      const songsSnapshot = await getDocs(songsQuery);
      
      let totalPlays = 0;
      let totalDownloads = 0;

      songsSnapshot.forEach(doc => {
        const song = doc.data() as Song;
        // The play count is not implemented yet, we will use likes as a placeholder for now
        totalPlays += song.likes || 0;
        totalDownloads += song.downloadCount || 0;
      });

      setStats({ totalPlays, totalDownloads });
      setLoadingStats(false);
    };

    fetchCreatorStats();
  }, [firestore, creator.id]);

  return (
    <Link href={`/profile/${creator.id}`} passHref>
      <Card className="hover:bg-secondary transition-colors text-center h-full">
        <CardContent className="p-4 flex flex-col items-center justify-between gap-4 h-full">
          <Avatar className="h-24 w-24 border-2 border-primary">
            <AvatarImage src={creator.avatarUrl} alt={creator.name} />
            <AvatarFallback>{creator.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-2 flex-grow flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1">
              <p className="font-semibold truncate">{creator.name}</p>
              <BadgeCheck className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">@{creator.username}</p>
          </div>
          {loadingStats ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <div className="flex justify-around w-full text-xs text-muted-foreground pt-2 border-t mt-auto">
              <div className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                <span>{stats.totalPlays.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                <span>{stats.totalDownloads.toLocaleString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};


export default function CreatorsPage() {
  const firestore = useFirestore();

  const creatorsQuery = useMemoFirebase(
    () => query(collection(firestore, 'users'), where('role', '==', 'creator')),
    [firestore]
  );

  const { data: creators, isLoading } = useCollection<User>(creatorsQuery);

  if (isLoading) {
    return (
      <>
        <Header title="Creators" />
        <div className="container flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Creators" />
      <div className="container py-6">
        <h2 className="text-2xl font-semibold tracking-tight mb-6">
          Meet the Artists
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {creators?.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      </div>
    </>
  );
}
