import { RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@src/shared/components/ui/alert';
import { toast } from 'sonner';

export const comingSoonToast = () => {
  toast.custom(() => (
    <Alert variant="mono" icon="success">
      <AlertIcon>
        <RiErrorWarningFill />
      </AlertIcon>
      <AlertTitle>This feature is coming soon.</AlertTitle>
    </Alert>
  ));
};
