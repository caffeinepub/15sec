import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setShowConsent(false);
  };

  if (!showConsent) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <Card className="max-w-md w-full pointer-events-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Cookie Notice</CardTitle>
          <CardDescription>
            We use cookies to enhance your experience and analyze site usage. By continuing to use this site, you consent to our use of cookies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAccept} className="w-full">
            Accept
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
