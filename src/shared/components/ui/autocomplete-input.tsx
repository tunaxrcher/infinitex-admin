'use client';

import * as React from 'react';
import { cn } from '@src/shared/lib/utils';
import { Check, Search } from 'lucide-react';

const MAX_VISIBLE = 30;

// ============================================
// Shared hooks
// ============================================

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void,
) {
  React.useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

function useFilteredSuggestions(suggestions: string[], query: string) {
  return React.useMemo(() => {
    if (!query) return suggestions.slice(0, MAX_VISIBLE);
    const q = query.toLowerCase();
    return suggestions
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, MAX_VISIBLE);
  }, [suggestions, query]);
}

// ============================================
// Highlight helper
// ============================================

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-primary">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

// ============================================
// AutocompleteInput
// ============================================

interface AutocompleteInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'onSelect'
  > {
  suggestions: string[];
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (value: string) => void;
}

const AutocompleteInput = React.forwardRef<
  HTMLInputElement,
  AutocompleteInputProps
>(({ className, suggestions, value = '', onChange, onSelect, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const [activeIdx, setActiveIdx] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  useClickOutside(containerRef, () => setOpen(false));

  const filtered = useFilteredSuggestions(suggestions, inputValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    onChange?.(v);
    setActiveIdx(-1);
    setOpen(true);
  };

  const handleSelect = (item: string) => {
    setInputValue(item);
    onChange?.(item);
    onSelect?.(item);
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(filtered[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Scroll active item into view
  React.useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const el = listRef.current.children[activeIdx] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={ref}
          type="text"
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent py-1 pl-8 pr-3 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className,
          )}
          value={inputValue}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          {...props}
        />
      </div>
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border bg-popover shadow-md"
        >
          {filtered.map((item, i) => (
            <button
              key={item}
              type="button"
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                i === activeIdx && 'bg-accent text-accent-foreground',
                item === inputValue && 'bg-primary/5',
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIdx(i)}
            >
              {item === inputValue ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <span className="truncate">
                <HighlightMatch text={item} query={inputValue} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
AutocompleteInput.displayName = 'AutocompleteInput';

// ============================================
// AutocompleteTextarea
// ============================================

interface AutocompleteTextareaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'onChange' | 'onSelect'
  > {
  suggestions: string[];
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (value: string) => void;
}

const AutocompleteTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutocompleteTextareaProps
>(({ className, suggestions, value = '', onChange, onSelect, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const [activeIdx, setActiveIdx] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  useClickOutside(containerRef, () => setOpen(false));

  const filtered = useFilteredSuggestions(suggestions, inputValue);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setInputValue(v);
    onChange?.(v);
    setActiveIdx(-1);
    setOpen(true);
  };

  const handleSelect = (item: string) => {
    setInputValue(item);
    onChange?.(item);
    onSelect?.(item);
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(filtered[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  React.useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const el = listRef.current.children[activeIdx] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  return (
    <div ref={containerRef} className="relative">
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
        value={inputValue}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        {...props}
      />
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border bg-popover shadow-md"
        >
          {filtered.map((item, i) => (
            <button
              key={item}
              type="button"
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                i === activeIdx && 'bg-accent text-accent-foreground',
                item === inputValue && 'bg-primary/5',
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIdx(i)}
            >
              {item === inputValue ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <span className="line-clamp-2">
                <HighlightMatch text={item} query={inputValue} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
AutocompleteTextarea.displayName = 'AutocompleteTextarea';

export { AutocompleteInput, AutocompleteTextarea };
