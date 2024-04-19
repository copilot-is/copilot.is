import { IconRefresh, IconStop } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'

interface ChatRegenerateProps {
  isLoading: boolean
  hasMessages: boolean
  stop: () => void
  reload: () => void
}

export function ChatRegenerate({
  isLoading,
  hasMessages,
  stop,
  reload
}: ChatRegenerateProps) {
  return (
    <>
      {isLoading ? (
        <Button
          variant="outline"
          className="bg-background px-3"
          onClick={() => stop()}
        >
          <IconStop className="mr-1" />
          Stop generating
        </Button>
      ) : (
        hasMessages && (
          <Button
            variant="outline"
            className="bg-background px-3"
            onClick={() => reload()}
          >
            <IconRefresh className="mr-1" />
            Regenerate
          </Button>
        )
      )}
    </>
  )
}
