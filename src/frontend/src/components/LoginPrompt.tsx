import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPrompt() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-4xl font-bold">15sec</h1>
            <span className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
          </div>
          <CardTitle>Share your world in 15 seconds.</CardTitle>
          <CardDescription>Sign in to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? "Signing in..." : "Sign in with Internet Identity"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
