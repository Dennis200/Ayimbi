import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Music, Twitter, Instagram, Facebook } from 'lucide-react';
import Image from 'next/image';
import { placeholderImages } from '@/lib/data';

export default function LandingPage() {
  const heroImage = placeholderImages.find(p => p.id === 'hero');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="container z-40 bg-background">
        <div className="flex h-20 items-center justify-between py-6">
          <Link href="/" className="flex items-center space-x-2">
            <Music className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">MuseFlow</span>
          </Link>
          <nav>
            <Button asChild>
              <Link href="/home">Enter App</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="font-headline text-3xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Experience Music Like Never Before
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Discover, stream, and share a constantly expanding mix of music
              from emerging and major artists around the world.
            </p>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href="/home">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>
        <section
          id="features"
          className="container space-y-6 bg-secondary py-8 dark:bg-transparent md:py-12 lg:py-24"
        >
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-headline text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
              Features
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              MuseFlow is packed with features to enhance your listening experience.
            </p>
          </div>
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-12 w-12"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                <div className="space-y-2">
                  <h3 className="font-bold">Unlimited Streaming</h3>
                  <p className="text-sm text-muted-foreground">
                    Access a vast library of songs, albums, and EPs.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-12 w-12"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <div className="space-y-2">
                  <h3 className="font-bold">Offline Downloads</h3>
                  <p className="text-sm text-muted-foreground">
                    Download your favorite tracks and listen anywhere.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                 <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-12 w-12"
                  >
                   <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  </svg>
                <div className="space-y-2">
                  <h3 className="font-bold">Social Interaction</h3>
                  <p className="text-sm text-muted-foreground">
                    Like, comment, and share music with the community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="container grid grid-cols-1 gap-12 py-12 md:grid-cols-2 lg:py-24">
          <div className="flex flex-col justify-center">
            <h2 className="font-headline text-3xl font-extrabold tracking-tighter sm:text-4xl md:text-5xl">
              For Creators
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground md:text-xl">
              Upload your music, share your art, and connect with fans. MuseFlow gives you the tools to grow your audience.
            </p>
            <Button asChild className="mt-6 w-fit">
              <Link href="/home">Become a Creator</Link>
            </Button>
          </div>
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              width={600}
              height={400}
              className="rounded-lg object-cover"
              data-ai-hint={heroImage.imageHint}
            />
          )}
        </section>
      </main>
      <footer className="border-t">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <Music className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">MuseFlow</span>
              </Link>
              <p className="text-sm text-muted-foreground">Your next-gen music streaming experience.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">About Us</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Careers</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Press</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">FAQ</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <Link href="#" className="text-muted-foreground hover:text-foreground"><Twitter className="h-6 w-6" /></Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground"><Instagram className="h-6 w-6" /></Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground"><Facebook className="h-6 w-6" /></Link>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} MuseFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
