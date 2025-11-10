'use client';

import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { UserPermission } from '@src/app/models/user';
import { apiFetch } from '@src/shared/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@src/shared/components/ui/alert';
import { Button } from '@src/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';

export interface PermissionDeleteDialogProps {
  open: boolean;
  closeDialog: () => void;
  permission: UserPermission;
}

const PermissionDeleteDialog = ({
  open,
  closeDialog,
  permission,
}: PermissionDeleteDialogProps) => {
  const queryClient = useQueryClient();

  // Define the mutation for deleting the permission
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(
        `/api/user-management/permissions/${permission.id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      const message = 'Permission deleted successfully';

      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ),
        {
          position: 'top-center',
        },
      );

      queryClient.invalidateQueries({ queryKey: ['user-permissions'] }); // Refetch permissions list
      closeDialog();
    },
    onError: (error: Error) => {
      const message = error.message;
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ),
        {
          position: 'top-center',
        },
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you sure you want to delete the permission ?
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.status === 'pending'}
          >
            {mutation.status === 'pending' && (
              <LoaderCircleIcon className="animate-spin" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionDeleteDialog;
