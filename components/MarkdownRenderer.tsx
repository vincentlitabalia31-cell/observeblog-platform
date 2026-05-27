import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-slate max-w-none text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [
            rehypeSanitize,
            {
              ...defaultSchema,
              attributes: {
                ...defaultSchema.attributes,
                a: [...(defaultSchema.attributes?.a || []), ['target'], ['rel']]
              }
            }
          ]
        ]}
        components={{
          a: ({ node, ...props }) => (
            <a
              {...props}
              target={props.href?.startsWith('http') ? '_blank' : undefined}
              rel={props.href?.startsWith('http') ? 'noreferrer noopener' : undefined}
              className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
            />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
