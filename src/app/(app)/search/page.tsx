import { Header } from '@/components/layout/header';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';

export default function SearchPage() {
  return (
    <>
      <Header title="Search" />
      <div className="container py-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for songs, albums, artists..."
            className="w-full rounded-full pl-10 h-12 text-lg"
          />
        </div>
        <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Find your next favorite track.</p>
        </div>
      </div>
    </>
  );
}
