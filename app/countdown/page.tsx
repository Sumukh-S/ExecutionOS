"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UtilityPage } from "@/components/utility-page";

export default function CountdownPage() {
  const [remaining, setRemaining] = useState(30 * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setRemaining((value) => value > 0 ? value - 1 : 0), 1000); return () => window.clearInterval(timer); }, [running]);
  useEffect(() => { if (remaining === 0) setRunning(false); }, [remaining]);
  const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");
  return <UtilityPage title="Countdown" description="Give a bounded block of time to the thing in front of you."><Card className="mx-auto max-w-xl"><CardContent className="p-8 text-center sm:p-12"><div className="font-mono text-7xl font-light tracking-tight sm:text-8xl">{minutes}:{seconds}</div><div className="mt-8 flex justify-center gap-3"><Button size="lg" onClick={() => setRunning((value) => !value)}>{running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{running ? "Pause" : "Start"}</Button><Button size="lg" variant="outline" onClick={() => { setRunning(false); setRemaining(30 * 60); }}><RotateCcw className="mr-2 h-4 w-4" />Reset</Button></div></CardContent></Card></UtilityPage>;
}
