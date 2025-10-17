import { ReactNode } from 'react';

function Toolbar({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3.5 pt-0 pb-5 lg:py-5">
      {children}
    </div>
  );
}

function ToolbarActions({ children }: { children?: ReactNode }) {
  return <div className="flex items-center gap-2.5">{children}</div>;
}

function ToolbarHeading ({ children }: { children: ReactNode }) {
  return <div className="flex flex-col justify-center gap-1.5">{children}</div>;
}

export {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
};
