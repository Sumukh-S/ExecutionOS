import Link from "next/link";
import { BarChart3, BookOpen, Calendar, Database, Target, Timer } from "lucide-react";
import { UtilityPage } from "@/components/utility-page";

const links = [{ href: "/goals", label: "Goals", icon: Target }, { href: "/weekly", label: "Weekly plan", icon: Calendar }, { href: "/monthly", label: "Monthly plan", icon: Calendar }, { href: "/eisenhower", label: "Eisenhower matrix", icon: Timer }, { href: "/analytics", label: "Analytics", icon: BarChart3 }, { href: "/standards", label: "Standards & practices", icon: BookOpen }, { href: "/countdown", label: "Countdown", icon: Calendar }, { href: "/backup", label: "Backup", icon: Database }];
export default function MorePage() { return <UtilityPage title="More" description="The rest of your execution toolkit."><div className="grid gap-3 sm:grid-cols-2">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"><Icon className="h-5 w-5 text-primary" /><span className="font-medium">{label}</span></Link>)}</div></UtilityPage>; }
