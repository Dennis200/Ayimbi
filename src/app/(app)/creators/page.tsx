'use client';
import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { BadgeCheck } from 'lucide-react';

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
            <Link key={creator.id} href={`/profile/${creator.id}`} passHref>
              <Card className="hover:bg-secondary transition-colors text-center">
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage src={creator.avatarUrl} alt={creator.name} />
                    <AvatarFallback>
                      {creator.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                     <div className="flex items-center justify-center gap-1">
                        <p className="font-semibold truncate">{creator.name}</p>
                        <BadgeCheck className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      @{creator.username}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
