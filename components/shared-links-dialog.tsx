import { useState } from 'react';
import { CircleNotch, Link, Trash } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { useSharedLinks } from '@/hooks/use-shared-links';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface SharedLinksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LIMIT = 5;

export function SharedLinksDialog({
  open,
  onOpenChange
}: SharedLinksDialogProps) {
  const [page, setPage] = useState(0);
  const [isDeleting, setIsDeleting] = useState<Set<string>>(new Set());
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const { sharedLinks, isLoading, deleteSharedLink, deleteAllSharedLinks } =
    useSharedLinks(page, LIMIT);

  const handlePrevious = () => {
    if (page > 0) {
      setPage(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (sharedLinks && sharedLinks.length === LIMIT) {
      setPage(prev => prev + 1);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(prev => new Set(prev).add(id));
      await deleteSharedLink(id);
      toast.success('Shared link deleted', { duration: 2000 });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDeleteAll = async () => {
    try {
      setIsDeletingAll(true);
      await deleteAllSharedLinks();
      toast.success('All shared links deleted', { duration: 2000 });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Shared Links</DialogTitle>
        </DialogHeader>
        {isLoading && (
          <div className="flex justify-center p-4">
            <CircleNotch className="size-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && (
          <>
            {sharedLinks?.length ? (
              <>
                <table className="w-full table-auto">
                  <thead>
                    <tr>
                      <th className="p-2 pl-px text-left">Name</th>
                      <th className="w-40 p-2 text-left">Date shared</th>
                      <th className="w-8 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={handleDeleteAll}
                          disabled={isDeletingAll || isDeleting.size > 0}
                          title="Delete all"
                        >
                          {isDeletingAll ? (
                            <CircleNotch className="size-4 animate-spin" />
                          ) : (
                            <Trash className="size-4" />
                          )}
                        </Button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharedLinks.map(link => (
                      <tr key={link.id} className="border-t">
                        <td className="p-2 pl-px">
                          <a
                            href={`/share/${link.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-500 hover:underline"
                          >
                            <Link className="mr-1" />
                            <span className="truncate">{link.chat?.title}</span>
                          </a>
                        </td>
                        <td className="p-2">
                          {format(link.createdAt, 'MMMM d, yyyy')}
                        </td>
                        <td className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => handleDelete(link.id)}
                            disabled={isDeleting.has(link.id)}
                            title="Delete"
                          >
                            {isDeleting.has(link.id) ? (
                              <CircleNotch className="size-4 animate-spin" />
                            ) : (
                              <Trash />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No shared links found
              </div>
            )}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={page === 0 || isDeletingAll || isDeleting.size > 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={
                  (sharedLinks && sharedLinks.length < 5) ||
                  isDeletingAll ||
                  isDeleting.size > 0
                }
              >
                Next
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
