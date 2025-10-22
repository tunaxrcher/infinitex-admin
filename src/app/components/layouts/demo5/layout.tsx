'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@src/shared/components/ui/button';
import { Calendar } from '@src/shared/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@src/shared/components/ui/popover';
import { useBodyClass } from '@src/shared/hooks/use-body-class';
import { useIsMobile } from '@src/shared/hooks/use-mobile';
import { useSettings } from '@src/shared/providers/settings-provider';
import { addDays, format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { Navbar } from './components/navbar';
import { Sidebar } from './components/sidebar';
import { Toolbar, ToolbarActions, ToolbarHeading } from './components/toolbar';

const Demo5Layout = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { setOption } = useSettings();

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 20),
    to: addDays(new Date(2025, 0, 20), 20),
  });

  // Using the custom hook to set multiple CSS variables and class properties
  useBodyClass(`
    [--header-height:54px]
    [--sidebar-width:200px]  
  `);

  useEffect(() => {
    setOption('layout', 'demo5');
    setOption('container', 'fluid');
  }, [setOption]);

  return (
    <>
      <div className="flex grow flex-col in-data-[sticky-header=on]:pt-(--header-height)">
        <Header />

        <Navbar />

        <div className="w-full flex px-0 lg:ps-4">
          {!isMobile && <Sidebar />}

          <main className="flex flex-col grow">
            {!pathname.includes('/public-profile/') &&
              !pathname.includes('/user-management') &&
              !pathname.includes('/store-client') && (
                <Toolbar>
                  <ToolbarHeading />
                  <ToolbarActions>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button id="date" variant="outline" mode="input">
                          <CalendarDays />
                          {date?.from ? (
                            date.to ? (
                              <span>
                                {format(date.from, 'LLL dd, y')} -{' '}
                                {format(date.to, 'LLL dd, y')}
                              </span>
                            ) : (
                              format(date.from, 'LLL dd, y')
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="range"
                          defaultMonth={date?.from}
                          selected={date}
                          onSelect={setDate}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </ToolbarActions>
                </Toolbar>
              )}

            {children}

            <Footer />
          </main>
        </div>
      </div>
    </>
  );
};

export { Demo5Layout };
