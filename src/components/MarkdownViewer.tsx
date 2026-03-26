import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState } from "react";
import { getMarkdownImageUrl, resolveMarkdownImageUrl } from "../services/supabaseStorage";

interface MarkdownViewerProps {
    content: string
    resolveImageSrc?: (source: string) => string
}

function isImageOnlyParagraph(children: ReactNode[]) {
    return children.every((child) => {
        if (typeof child === 'string') {
            return child.trim() === ''
        }

        if (!child || typeof child !== 'object' || !('type' in child)) {
            return false
        }

        return child.type === 'img'
    })
}

function MarkdownImage({
    alt = '',
    resolveImageSrc,
    src = '',
}: {
    alt?: string
    resolveImageSrc?: (source: string) => string
    src?: string
}) {
    const initialSrc = resolveImageSrc ? resolveImageSrc(src) : resolveMarkdownImageUrl(src)
    const [resolvedSrc, setResolvedSrc] = useState(initialSrc)

    useEffect(() => {
        let cancelled = false
        const nextInitialSrc = resolveImageSrc ? resolveImageSrc(src) : resolveMarkdownImageUrl(src)

        setResolvedSrc(nextInitialSrc)

        if (resolveImageSrc || !src || /^(https?:)?\/\//i.test(src) || src.startsWith('/') || src.startsWith('blob:') || src.startsWith('data:')) {
            return
        }

        void getMarkdownImageUrl(src).then((signedUrl) => {
            if (!cancelled) {
                setResolvedSrc(signedUrl)
            }
        })

        return () => {
            cancelled = true
        }
    }, [resolveImageSrc, src])

    return (
        <img
            src={resolvedSrc}
            alt={alt}
            className="w-[20%] h-auto max-w-full rounded-lg object-contain"
            loading="lazy"
        />
    )
}

export default function MarkdownViewer({ content, resolveImageSrc }: MarkdownViewerProps) {
    return (
        <div className="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children, ...props }: ComponentProps<'p'>) => {
                        const childArray = Array.isArray(children) ? children : [children]

                        if (isImageOnlyParagraph(childArray)) {
                            return (
                                <div {...props} className="markdown-image-row">
                                    {children}
                                </div>
                            )
                        }

                        return <p {...props}>{children}</p>
                    },
                    img: ({ src = '', alt = '' }) => (
                        <MarkdownImage
                            src={src}
                            alt={alt}
                            resolveImageSrc={resolveImageSrc}
                        />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div >
    )
}
