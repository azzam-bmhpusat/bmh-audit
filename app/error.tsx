"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, RotateCcwIcon } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Catat log detail di console server/klien untuk pelacakan
    console.error("[APP_ERROR]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-background">
      <div className="w-full max-w-md space-y-4 text-center">
        <Alert variant="destructive" className="text-left">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Terjadi Kesalahan</AlertTitle>
          <AlertDescription>
            Sistem mengalami kendala saat memproses halaman ini. Silakan coba kembali beberapa saat lagi.
          </AlertDescription>
        </Alert>

        <div className="flex justify-center pt-2">
          <Button onClick={() => reset()} className="gap-2">
            <RotateCcwIcon className="size-4" />
            Coba lagi
          </Button>
        </div>
      </div>
    </div>
  );
}
