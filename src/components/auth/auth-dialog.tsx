
'use client';

import { useState } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { useFirebaseApp, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthError = (error: any) => {
    setLoading(false);
    console.error(error);
    toast({
      title: 'Authentication Error',
      description: error.message,
      variant: 'destructive',
    });
  };
  
  const createUserProfileDocument = (user: any) => {
    const userRef = doc(firestore, 'users', user.uid);
    const userData = {
        name: name || user.displayName,
        email: user.email,
        avatarUrl: user.photoURL,
        role: 'user',
    };
    setDoc(userRef, userData, { merge: true })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: userData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onOpenChange(false);
    } catch (error) {
      handleAuthError(error);
    } finally {
        setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Create user profile in Firestore
      createUserProfileDocument(userCredential.user);

      onOpenChange(false);
    } catch (error) {
      handleAuthError(error);
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Create user profile in Firestore
      createUserProfileDocument(result.user);
      onOpenChange(false);
    } catch (error) {
      handleAuthError(error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Ayimbi</DialogTitle>
          <DialogDescription>
            Sign in or create an account to continue.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email-login" className="text-right">
                  Email
                </Label>
                <Input
                  id="email-login"
                  type="email"
                  placeholder="user@example.com"
                  className="col-span-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password-login" className="text-right">
                  Password
                </Label>
                <Input
                  id="password-login"
                  type="password"
                  className="col-span-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Login'
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg
                      className="mr-2 h-4 w-4"
                      aria-hidden="true"
                      focusable="false"
                      data-prefix="fab"
                      data-icon="google"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 488 512"
                    >
                      <path
                        fill="currentColor"
                        d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 261.8S109.8 11.6 244 11.6c70.3 0 129.5 27.8 174.9 73.6l-65.3 64.2c-28.4-26.8-68.9-44.5-109.6-44.5-83.3 0-151.5 68.1-151.5 151.9s68.1 151.9 151.5 151.9c98.3 0 130.4-67.4 134.8-103.3H244V261.8h244z"
                      ></path>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="signup">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name-signup" className="text-right">
                  Name
                </Label>
                <Input
                  id="name-signup"
                  placeholder="Your Name"
                  className="col-span-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email-signup" className="text-right">
                  Email
                </Label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="user@example.com"
                  className="col-span-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password-signup" className="text-right">
                  Password
                </Label>
                <Input
                  id="password-signup"
                  type="password"
                  className="col-span-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="w-full"
                onClick={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Create Account'
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
