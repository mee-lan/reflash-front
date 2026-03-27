import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState } from "react";
import { ResizableBox } from "react-resizable";
import { getMarkdownImageUrl, resolveMarkdownImageUrl } from "../services/supabaseStorage";

interface MarkdownViewerProps {
    content: string
    enableImageResize?: boolean
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

        return child.type === 'img' || child.type === MarkdownImage
    })
}

function MarkdownImage({
    alt = '',
    enableResize = false,
    resolveImageSrc,
    src = '',
}: {
    alt?: string
    enableResize?: boolean
    resolveImageSrc?: (source: string) => string
    src?: string
}) {
    const initialSrc = resolveImageSrc ? resolveImageSrc(src) : resolveMarkdownImageUrl(src)
    const [resolvedSrc, setResolvedSrc] = useState(initialSrc)
    const [imageSize, setImageSize] = useState({ width: 320, height: 240 })
    const [showFullscreenImage, setShowFullscreenImage] = useState(false)
    const [naturalImageSize, setNaturalImageSize] = useState({ width: 320, height: 240 })

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

    const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
        const imageElement = event.currentTarget
        const naturalWidth = imageElement.naturalWidth || 320
        const naturalHeight = imageElement.naturalHeight || 240
        setNaturalImageSize({ width: naturalWidth, height: naturalHeight })
        const aspectRatio = naturalWidth / naturalHeight || 1
        const maxInitialWidth = 680
        const maxInitialHeight = 520
        let nextWidth = Math.max(120, naturalWidth)
        let nextHeight = Math.max(80, Math.round(nextWidth / aspectRatio))

        if (nextWidth > maxInitialWidth) {
            nextWidth = maxInitialWidth
            nextHeight = Math.max(80, Math.round(nextWidth / aspectRatio))
        }

        if (nextHeight > maxInitialHeight) {
            nextHeight = maxInitialHeight
            nextWidth = Math.max(120, Math.round(nextHeight * aspectRatio))
        }

        setImageSize({ width: nextWidth, height: nextHeight })
    }

    if (enableResize) {
        return (
            <>
                <ResizableBox
                    width={imageSize.width}
                    height={imageSize.height}
                    minConstraints={[120, 80]}
                    maxConstraints={[680, 520]}
                    lockAspectRatio
                    resizeHandles={['se']}
                    onResizeStop={(_event, data) => {
                        setImageSize({
                            width: data.size.width,
                            height: data.size.height,
                        })
                    }}
                    handle={
                        <span
                            className="markdown-resize-handle"
                            onClick={(event) => event.stopPropagation()}
                            onDoubleClick={(event) => event.stopPropagation()}
                        />
                    }
                >
                    <img
                        src={resolvedSrc}
                        alt={alt}
                        className="markdown-resizable-image w-full h-full rounded-lg object-contain cursor-zoom-in"
                        loading="lazy"
                        onLoad={handleImageLoad}
                        onClick={(event) => {
                            event.stopPropagation()
                        }}
                        onDoubleClick={(event) => {
                            event.stopPropagation()
                            setShowFullscreenImage(true)
                        }}
                    />
                </ResizableBox>

                {showFullscreenImage && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
                        onClick={(event) => {
                            event.stopPropagation()
                            setShowFullscreenImage(false)
                        }}
                    >
                        <button
                            type="button"
                            className="absolute right-6 top-6 text-white text-3xl leading-none"
                            onClick={(event) => {
                                event.stopPropagation()
                                setShowFullscreenImage(false)
                            }}
                        >
                            ×
                        </button>
                        <img
                            src={resolvedSrc}
                            alt={alt}
                            className="object-contain rounded-lg"
                            style={{
                                width: `${Math.min(naturalImageSize.width, window.innerWidth - 48)}px`,
                                height: `${Math.min(naturalImageSize.height, window.innerHeight - 48)}px`,
                                maxWidth: '100%',
                                maxHeight: '100%',
                            }}
                            onClick={(event) => event.stopPropagation()}
                        />
                    </div>
                )}
            </>
        )
    }

    return (
        <img
            src={resolvedSrc}
            alt={alt}
            className="w-[20%] h-auto max-w-full rounded-lg object-contain"
            loading="lazy"
        />
    )
}

export default function MarkdownViewer({ content, enableImageResize = false, resolveImageSrc }: MarkdownViewerProps) {
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
                            enableResize={enableImageResize}
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
