import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-4 text-center">
      <div className="text-6xl">🍞</div>
      <h1 className="text-2xl font-serif font-bold text-foreground">404</h1>
      <p className="text-muted-foreground text-sm">Page not found</p>
      <Link href="/">
        <button className="mt-2 h-10 px-6 rounded-xl text-sm font-semibold"
          style={{ background: '#d4a844', color: '#0f0d0b' }}>
          {t.dashboard}
        </button>
      </Link>
    </div>
  );
}
