import { useLayout } from './context';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function Wrapper({ children }: { children: React.ReactNode }) {
  const {isMobile} = useLayout();

  return (
    <>
      <Header />
      {!isMobile && <Sidebar />}      
      <div className="grow pt-(--header-height-mobile) lg:pt-(--header-height) lg:ps-(--sidebar-width) lg:in-data-[sidebar-open=false]:ps-(--sidebar-collapsed-width) transition-all duration-300">
        <main className="grow" role="content">
          {children}
        </main>
      </div>
    </>
  );
}
