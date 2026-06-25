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
      <html lang="pt-BR" className="dark" style={{ colorScheme: 'dark' }}>
        {/* O fundo de toda a aplicação será um verde bem escuro */}
        <body className="bg-[#0b1713] text-slate-200 min-h-screen flex flex-col font-sans">
          
          {/* TopBar (Barra de Navegação) */}
          <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-[#11241d] border-b border-[#1b362c]">
            
            {/* Lado Esquerdo: Logo e Menu PC */}
            <div className="flex items-center gap-6">
              <h1 className="text-lg sm:text-xl font-bold text-emerald-400">StudyTracker</h1>
              <nav className="hidden sm:flex gap-4">
                <Link href="/" className="text-sm hover:text-emerald-400 transition-colors">Dashboard</Link>
                <Link href="/estudos" className="text-sm hover:text-emerald-400 transition-colors">Estudos</Link>
                <Link href="/ranking" className="text-sm hover:text-emerald-400 transition-colors">Ranking</Link>
              </nav>
            </div>
            
            {/* Lado Direito: Menu Mobile e Avatar */}
            <div className="flex items-center gap-3">
              
              {/* Navegação visível APENAS no mobile */}
              <nav className="flex sm:hidden gap-1.5">
                <Link href="/" className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-[#162c23] border border-emerald-500/20">
                  Dash
                </Link>
                <Link href="/estudos" className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-[#0b1713] border border-[#1b362c]">
                  Estudos
                </Link>
                <Link href="/ranking" className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-[#0b1713] border border-[#1b362c]">
                  Rank
                </Link>
              </nav>
              
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