import { useState, useEffect } from 'react';
import { useSaveCallerUserProfile, useCheckUsernameAvailability } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function UsernameSetupModal() {
  const [username, setUsername] = useState('');
  const [debouncedUsername, setDebouncedUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const { mutate: saveProfile, isPending } = useSaveCallerUserProfile();
  const checkUsername = useCheckUsernameAvailability();

  useEffect(() => {
    const timer = setTimeout(async () => {
      setDebouncedUsername(username);
      if (username.length >= 3) {
        setCheckingAvailability(true);
        try {
          const available = await checkUsername.mutateAsync(username);
          setIsAvailable(available);
        } catch {
          setIsAvailable(null);
        } finally {
          setCheckingAvailability(false);
        }
      } else {
        setIsAvailable(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (!isAvailable) {
      toast.error('Username is not available');
      return;
    }

    saveProfile(
      { username: username.trim(), avatar: undefined },
      {
        onSuccess: () => {
          toast.success('Profile created successfully!');
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to create profile');
        },
      }
    );
  };

  const showAvailability = debouncedUsername.length >= 3 && !checkingAvailability && isAvailable !== null;
  const availabilityColor = isAvailable ? 'text-green-600' : 'text-destructive';

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Choose your username</DialogTitle>
          <DialogDescription>Pick a unique username to get started on 15sec</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
              disabled={isPending}
            />
            {checkingAvailability && (
              <p className="text-sm text-muted-foreground">Checking availability...</p>
            )}
            {showAvailability && (
              <p className={`text-sm ${availabilityColor}`}>
                {isAvailable ? '✓ Username available' : '✗ Username taken'}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !isAvailable || username.length < 3 || checkingAvailability}
          >
            {isPending ? 'Creating profile...' : 'Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
