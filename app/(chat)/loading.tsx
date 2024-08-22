import { IconLoader } from '@/components/ui/icons';

export default function Loading() {
  return (
    <div className="group flex size-full items-center justify-center bg-background pl-0 duration-300 ease-in-out peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]">
      <IconLoader className="mt-4 size-8 animate-spin" />
    </div>
  );
}
