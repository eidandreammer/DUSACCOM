import { LoaderCircle } from 'lucide-react';
export default function Loading() { return <div role="status" className="container flex min-h-[50vh] items-center justify-center gap-3 text-sm text-slate-600"><LoaderCircle className="animate-spin" size={22} aria-hidden="true" />Connecting you to what’s next…</div>; }
