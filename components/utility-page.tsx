import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UtilityPage({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="min-h-screen p-4 sm:p-6 pb-24"><div className="mx-auto max-w-5xl space-y-6"><div><p className="text-sm text-muted-foreground">Execution OS</p><h1 className="text-2xl font-bold tracking-tight">{title}</h1><p className="mt-1 text-muted-foreground">{description}</p></div>{children}</div></div>;
}

export function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card><CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader><CardContent className="p-4 pt-0"><div className="text-2xl font-bold">{value}</div><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}
