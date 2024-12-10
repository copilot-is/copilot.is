import { memo } from 'react';
import ReactMarkdown, { Options } from 'react-markdown';

const MemoizedReactMarkdown = memo(
  (props: Options) => <ReactMarkdown {...props} />,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
);
MemoizedReactMarkdown.displayName = 'MemoizedReactMarkdown';

export { MemoizedReactMarkdown };
