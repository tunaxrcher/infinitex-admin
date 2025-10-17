'use client';

import { Toolbar, ToolbarActions, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from "@/components/layouts/layout-28/components/toolbar";
import { useLayout } from "@/components/layouts/layout-29/components/context";
import { Navbar } from "@/components/layouts/layout-29/components/navbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelRight } from "lucide-react";

export default function Page() {
  const { isSidebarOpen, isMobile, sidebarToggle } = useLayout();

  return (
    <div className="container-fluid">
      <Toolbar>
        <div className="flex items-center gap-3">
          {(!isSidebarOpen && !isMobile) && <Button mode="icon" variant="dim" onClick={() => sidebarToggle()} className="-ms-2">
            <PanelRight />
          </Button>}
          <ToolbarHeading>
            <ToolbarPageTitle>Jane Smith</ToolbarPageTitle>
            <ToolbarDescription>Manage roles, permissions, and collaboration settings</ToolbarDescription>
          </ToolbarHeading>
        </div>
        {!isMobile && (
          <ToolbarActions>
            <Navbar /> 
          </ToolbarActions>
        )}
      </Toolbar>

      <Skeleton
        className="rounded-lg grow h-screen border border-dashed border-input bg-background text-subtle-stroke relative text-border"
        style={{
				  backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 5px, currentcolor 5px, currentcolor 6px)'
				}}
      >
      </Skeleton>
    </div>
  );
}