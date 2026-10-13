import Link from "next/link";
import { CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function EmptyPage() { return <main className="grid min-h-screen place-items-center p-6"><Card className="w-full max-w-lg"><CardContent className="p-8 text-center sm:p-12"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><CheckCircle2 className="h-8 w-8" /></div><h1 className="mt-6 text-2xl font-bold">A clear system starts here.</h1><p className="mt-3 text-muted-foreground">There is nothing scheduled yet. Add one specific task with a time, outcome, and first action.</p><Link href="/tasks"><Button className="mt-6 gap-2"><Plus className="h-4 w-4" />Create your first task</Button></Link></CardContent></Card></main>; }
