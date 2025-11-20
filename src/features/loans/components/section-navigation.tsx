'use client';

import { useEffect, useState } from 'react';
import { cn } from '@src/shared/lib/utils';
import { Banknote, ChevronUp, FileText, LayoutList, Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@src/shared/components/ui/button';

interface Section {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sections: Section[] = [
  {
    id: 'financial-summary',
    label: 'ข้อมูลทางการเงิน',
    icon: Banknote,
  },
  {
    id: 'loan-list',
    label: 'รายการสินเชื่อ',
    icon: LayoutList,
  },
  {
    id: 'payment-reports',
    label: 'รายงานการชำระ',
    icon: FileText,
  },
];

export function SectionNavigation() {
  const [activeSection, setActiveSection] =
    useState<string>('financial-summary');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show scroll to top button after scrolling 300px
      setShowScrollTop(window.scrollY > 300);

      // Determine active section based on scroll position
      const sections = ['financial-summary', 'loan-list', 'payment-reports'];

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Check if section is in viewport (with some offset)
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80; // Offset for fixed header
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({
        top: y,
        behavior: 'smooth',
      });
    }
    setIsExpanded(false);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {/* Floating Navigation */}
      <motion.div
        className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:block"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <div className="relative">
          {/* Toggle Button */}
          <Button
            variant="mono"
            size="icon"
            className={cn(
              'rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all',
              isExpanded && 'bg-primary',
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Menu className="size-5" />
          </Button>

          {/* Expanded Menu */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="absolute right-16 top-0 bg-card border border-border rounded-lg shadow-xl p-2 min-w-[200px]"
              >
                <div className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all',
                          'hover:bg-accent hover:text-accent-foreground',
                          isActive && 'bg-primary/10 text-primary font-medium',
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="text-left">{section.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed right-6 bottom-6 z-40"
          >
            <Button
              variant="mono"
              size="icon"
              className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl"
              onClick={scrollToTop}
            >
              <ChevronUp className="size-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Quick Navigation (Bottom Bar) */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card border-t border-border shadow-lg"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <div className="flex items-center justify-around py-2 px-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all',
                  isActive && 'text-primary',
                )}
              >
                <Icon className={cn('size-5', isActive && 'scale-110')} />
                <span className="text-[10px] font-medium">{section.label}</span>
              </button>
            );
          })}

          {/* Scroll to Top on Mobile */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all text-muted-foreground"
            >
              <ChevronUp className="size-5" />
              <span className="text-[10px] font-medium">กลับด้านบน</span>
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
