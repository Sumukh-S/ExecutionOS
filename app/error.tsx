"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="grid min-h-screen place-items-center p-6"><div className="max-w-md text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-500/10 text-red-600"><AlertTriangle className="h-8 w-8" /></div><h1 className="mt-6 text-2xl font-bold">Something interrupted the plan.</h1><p className="mt-3 text-muted-foreground">The page could not finish loading. Your saved local task data is still safe.</p><Button className="mt-6 gap-2" onClick={() => reset()}><RefreshCw className="h-4 w-4" />Try again</Button></div></main>;
}
