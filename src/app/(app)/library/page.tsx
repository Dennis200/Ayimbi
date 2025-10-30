import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2 } from 'lucide-react';

export default function LibraryPage() {
  return (
    <>
      <Header title="Your Library" />
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Playlists</h2>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Playlist
          </Button>
        </div>
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Liked Songs</CardTitle>
                    <CardDescription>321 songs</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Your collection of liked songs.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>My Awesome Mix</CardTitle>
                    <CardDescription>25 songs</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">The ultimate workout mix.</p>
                </CardContent>
            </Card>
            <Card className="flex flex-col items-center justify-center text-center p-6 border-dashed">
                <Wand2 className="h-8 w-8 text-muted-foreground mb-2" />
                <CardTitle className="mb-2 text-lg">Generate a new playlist</CardTitle>
                <CardDescription className="mb-4">Let our AI curate a playlist based on your taste.</CardDescription>
                <Button variant="outline">
                    Generate with AI
                </Button>
            </Card>
        </div>
      </div>
    </>
  );
}
