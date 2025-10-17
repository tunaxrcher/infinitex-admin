import { Avatar } from '@src/shared/components/ui/avatar';
import { Button } from '@src/shared/components/ui/button';
import { DropdownMenu } from '@src/shared/components/ui/dropdown-menu';

export function SecondaryHeader() {
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b bg-white dark:bg-background">
      <div className="flex items-center gap-4">
        <span className="font-bold text-lg">Workspace</span>
        {/* Add navigation/menu here if needed */}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline">Upgrade</Button>
        <DropdownMenu>
          <Avatar />
        </DropdownMenu>
      </div>
    </header>
  );
}

