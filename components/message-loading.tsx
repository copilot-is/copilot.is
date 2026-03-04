import { IconLoading } from '@/components/ui/icons';
import { ModelIcon } from '@/components/model-icon';

export interface MessageLoadingProps {
  image?: string | null;
}

export function MessageLoading({ image }: MessageLoadingProps) {
  return (
    <div
      tabIndex={0}
      className="group mb-1 rounded-md pb-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="flex items-start">
        <div className="flex size-9 shrink-0 select-none items-center justify-center rounded-full bg-muted">
          <ModelIcon image={image} />
        </div>
        <div className="ml-3 flex min-h-9 flex-1 flex-col items-start justify-center overflow-hidden px-1">
          <div className="mr-12">
            <IconLoading className="text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
