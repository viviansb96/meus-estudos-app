import { ClerkProvider, UserButton } from '@clerk/nextjs';
import { ptBR } from '@clerk/localizations';
import Link from 'next/link';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR">
        {/* O fundo de toda a aplicação será um verde bem escuro */}
        <body className="bg-[#0b1713] text-slate-200 min-h-screen flex flex-col font-sans">
          
          {/* TopBar (Barra de Navegação) */}
          <header className="flex items-center justify-between px-6 py-4 bg-[#11241d] border-b border-[#1b362c]">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-emerald-400">StudyTracker</h1>
              <nav className="hidden sm:flex gap-4">
                <Link href="/" className="text-sm hover:text-emerald-400 transition-colors">Dashboard</Link>
                <Link href="/estudos" className="text-sm hover:text-emerald-400 transition-colors">Estudos</Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Navegação visível apenas no mobile */}
              <Link href="/estudos" className="sm:hidden text-xs bg-[#1b362c] px-3 py-1.5 rounded-md text-emerald-400">
                Estudos
              </Link>
              {/* Navegação visível apenas no mobile */}
              <Link href="/conteudos" className="sm:hidden text-xs bg-[#1b362c] px-3 py-1.5 rounded-md text-emerald-400">
                Conteúdos
              </Link>
              <UserButton />
            </div>
          </header>

          {/* Conteúdo dinâmico das páginas */}
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>
          
        </body>
      </html>
    </ClerkProvider>
  );
}