import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() { return <main className="grid min-h-screen place-items-center p-6"><div className="max-w-md text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><SearchX className="h-8 w-8" /></div><p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">404</p><h1 className="mt-2 text-3xl font-bold">This page is not on the plan.</h1><p className="mt-3 text-muted-foreground">The destination may have moved or never existed.</p><Link href="/"><Button className="mt-6 gap-2"><ArrowLeft className="h-4 w-4" />Back to today</Button></Link></div></main>; }
