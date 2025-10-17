'use client';

import { useLayout } from "@/components/layouts/layout-30/components/context";
import { Navbar } from "@/components/layouts/layout-30/components/navbar";
import { Toolbar, ToolbarHeading, ToolbarPageTitle, ToolbarDescription, ToolbarActions } from "@/components/layouts/layout-30/components/toolbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquareCode, NotebookText, Pin, Plus } from "lucide-react";

export default function Page() {
  const { isMobile } = useLayout();

  return (
    <div className="container-fluid py-5">
      {!isMobile && <Navbar />}

      <Toolbar>
        <div className="flex items-center gap-3">
          <ToolbarHeading>
            <ToolbarPageTitle>API’s</ToolbarPageTitle>
            <ToolbarDescription>Manage API</ToolbarDescription>
          </ToolbarHeading>
        </div>
        <ToolbarActions>
          <Button mode="icon" variant="outline"><MessageSquareCode /></Button>
          <Button mode="icon" variant="outline"><Pin /></Button>
          <Button variant="outline"><NotebookText />Reports</Button>
          <Button variant="mono"><Plus />Generate Key</Button>
        </ToolbarActions>
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