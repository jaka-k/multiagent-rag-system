'use client'

import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

// Untagged fences (EPUB chapters, some model output) are auto-detected within
// this subset; unrestricted detection misreads Go as CSS.
const DETECT_SUBSET = [
  'go',
  'python',
  'java',
  'typescript',
  'javascript',
  'bash',
  'sql',
  'json',
  'yaml',
  'rust',
  'c',
  'cpp',
  'csharp',
  'kotlin'
]

const REHYPE_PLUGINS: React.ComponentProps<typeof Markdown>['rehypePlugins'] = [
  [rehypeHighlight, { detect: true, subset: DETECT_SUBSET }]
]

export default function MarkdownContent({
  children,
  className
}: {
  children: string
  className?: string
}) {
  return (
    <Markdown rehypePlugins={REHYPE_PLUGINS} className={className}>
      {children}
    </Markdown>
  )
}
