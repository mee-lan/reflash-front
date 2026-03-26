import 'easymde/dist/easymde.min.css'
import EasyMDE from 'easymde'
import CodeMirror from 'codemirror'
import SimpleMDE from 'react-simplemde-editor'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Options } from 'easymde'

interface MarkdownEditorProps {
    value: string
    onChange: (value: string) => void
    onImageUpload?: (file: File) => Promise<string>
    onImageRemove?: (source: string) => void
    resolveImageSrc?: (source: string) => string
}

function replacePreviewImageSources(html: string, resolveImageSrc?: (source: string) => string) {
    if (!resolveImageSrc) {
        return html
    }

    return html.replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/g, (_, prefix: string, src: string, suffix: string) => {
        return `${prefix}${resolveImageSrc(src)}${suffix}`
    })
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function removeMarkdownImageBySource(content: string, source: string) {
    const escapedSource = escapeRegExp(source)
    const imagePattern = new RegExp(`!?\\[[^\\]]*\\]\\(${escapedSource}(?:\\s+"[^"]*")?\\)\\s*`, 'm')
    return content.replace(imagePattern, '')
}

function decoratePreviewImages(html: string, plainText: string, resolveImageSrc?: (source: string) => string) {
    const markdownImageSources = Array.from(
        plainText.matchAll(/!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g),
        (match) => match[1]
    )

    let imageIndex = 0
    const resolvedHtml = replacePreviewImageSources(html, resolveImageSrc)

    return resolvedHtml.replace(/<img\b[^>]*>/g, (imageTag) => {
        const source = markdownImageSources[imageIndex]
        imageIndex += 1

        if (!source) {
            return imageTag
        }

        return `
            <span class="markdown-preview-image-wrapper">
                ${imageTag}
                <button
                    type="button"
                    class="markdown-preview-image-remove"
                    data-markdown-image-remove="${source}"
                    aria-label="Remove image"
                    title="Remove image"
                >
                    ×
                </button>
            </span>
        `
    })
}

export default function MarkdownEditor({ value, onChange, onImageUpload, onImageRemove, resolveImageSrc }: MarkdownEditorProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const pendingEditorRef = useRef<any>(null)
    const codemirrorRef = useRef<CodeMirror.Editor | null>(null)
    const imageMarkersRef = useRef<Array<CodeMirror.TextMarker & { __markdownImageSource?: string }>>([])
    const valueRef = useRef(value)
    const onChangeRef = useRef(onChange)
    const onImageUploadRef = useRef(onImageUpload)
    const onImageRemoveRef = useRef(onImageRemove)
    const resolveImageSrcRef = useRef(resolveImageSrc)
    const [isUploadingImage, setIsUploadingImage] = useState(false)

    useEffect(() => {
        valueRef.current = value
    }, [value])

    useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    useEffect(() => {
        onImageUploadRef.current = onImageUpload
    }, [onImageUpload])

    useEffect(() => {
        onImageRemoveRef.current = onImageRemove
    }, [onImageRemove])

    useEffect(() => {
        resolveImageSrcRef.current = resolveImageSrc
    }, [resolveImageSrc])

    const handlePreviewClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement
        const removeButton = target.closest('[data-markdown-image-remove]') as HTMLElement | null

        if (!removeButton) {
            return
        }

        const imageSource = removeButton.getAttribute('data-markdown-image-remove')

        if (!imageSource) {
            return
        }

        event.preventDefault()
        event.stopPropagation()

        const updatedValue = removeMarkdownImageBySource(valueRef.current, imageSource)
        onChangeRef.current(updatedValue)
        onImageRemoveRef.current?.(imageSource)
    }

    useEffect(() => {
        const codemirror = codemirrorRef.current

        if (!codemirror) {
            return
        }

        imageMarkersRef.current.forEach((marker) => marker.clear())
        imageMarkersRef.current = []

        const imageMatches = Array.from(value.matchAll(/!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g))

        for (const match of imageMatches) {
            const rawMarkdown = match[0]
            const imageSource = match[1]
            const startIndex = match.index ?? -1

            if (startIndex < 0) {
                continue
            }

            const endIndex = startIndex + rawMarkdown.length
            const from = codemirror.posFromIndex(startIndex)
            const to = codemirror.posFromIndex(endIndex)
            const imageNode = document.createElement('img')

            imageNode.src = resolveImageSrcRef.current ? resolveImageSrcRef.current(imageSource) : imageSource
            imageNode.alt = ''
            imageNode.className = 'markdown-inline-editor-image'

            const marker = codemirror.markText(from, to, {
                replacedWith: imageNode,
                atomic: true,
                clearOnEnter: false,
                handleMouseEvents: true,
            }) as CodeMirror.TextMarker & { __markdownImageSource?: string }

            marker.__markdownImageSource = imageSource
            imageMarkersRef.current.push(marker)
        }
    }, [value])

    useEffect(() => {
        const codemirror = codemirrorRef.current

        if (!codemirror) {
            return
        }

        const removeImageMarkerNearCursor = (direction: 'backward' | 'forward') => {
            const selection = codemirror.getDoc().listSelections?.()

            if (selection && selection.some((range) => range.anchor.line !== range.head.line || range.anchor.ch !== range.head.ch)) {
                return CodeMirror.Pass
            }

            const cursor = codemirror.getCursor()

            for (const marker of imageMarkersRef.current) {
                const range = marker.find()

                if (!range || !('from' in range) || !('to' in range)) {
                    continue
                }

                const isBackwardMatch =
                    direction === 'backward' &&
                    range.to.line === cursor.line &&
                    range.to.ch === cursor.ch
                const isForwardMatch =
                    direction === 'forward' &&
                    range.from.line === cursor.line &&
                    range.from.ch === cursor.ch

                if (!isBackwardMatch && !isForwardMatch) {
                    continue
                }

                codemirror.replaceRange('', range.from, range.to)
                if (marker.__markdownImageSource) {
                    onImageRemoveRef.current?.(marker.__markdownImageSource)
                }
                return
            }

            return CodeMirror.Pass
        }

        const keyMap = {
            Backspace: () => removeImageMarkerNearCursor('backward'),
            Delete: () => removeImageMarkerNearCursor('forward'),
        }

        codemirror.addKeyMap(keyMap)

        return () => {
            codemirror.removeKeyMap(keyMap)
        }
    }, [])

    const handleImageSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0]

        if (!selectedFile) {
            return
        }

        if (!onImageUploadRef.current) {
            alert('Image upload is not configured for this editor.')
            event.target.value = ''
            return
        }

        try {
            setIsUploadingImage(true)
            const storedImagePath = await onImageUploadRef.current(selectedFile)
            const markdownImage = `![${selectedFile.name}](${storedImagePath})`
            const editor = pendingEditorRef.current

            if (editor?.codemirror) {
                const cursor = editor.codemirror.getCursor()
                editor.codemirror.replaceRange(markdownImage, cursor)
            } else {
                const currentValue = valueRef.current
                onChangeRef.current(`${currentValue}${currentValue.endsWith('\n') || !currentValue ? '' : '\n'}${markdownImage}`)
            }
        } catch (error) {
            console.error('Failed to upload image:', error)
            alert(error instanceof Error ? error.message : 'Failed to upload image.')
        } finally {
            setIsUploadingImage(false)
            pendingEditorRef.current = null
            event.target.value = ''
        }
    }

    const options: Options = useMemo(() => {
        return {
            spellChecker: false,
            placeholder: 'Enter markdown content here...',
            status: false,
            previewRender: function (plainText) {
                const renderedHtml = typeof (this as { parent?: { markdown?: (text: string) => string } }).parent?.markdown === 'function'
                    ? (this as { parent: { markdown: (text: string) => string } }).parent.markdown(plainText)
                    : (EasyMDE.prototype as unknown as { markdown: (text: string) => string }).markdown(plainText)

                return decoratePreviewImages(renderedHtml, plainText, resolveImageSrcRef.current)
            },
            toolbar: [
                'bold',           // **bold**
                'italic',         // *italic*
                'heading',        // # heading
                '|',
                'quote',          // > quote (we can use this for highlight effect)
                'unordered-list',
                'ordered-list',
                '|',
                'link',           // hyperlinks
                {
                    name: 'upload-image',
                    action: (editor) => {
                        if (isUploadingImage) {
                            return
                        }

                        if (!fileInputRef.current) {
                            return
                        }

                        pendingEditorRef.current = editor
                        fileInputRef.current.click()
                    },
                    className: 'fa fa-picture-o',
                    title: 'Upload image',
                },
                '|',
                'preview',
            ],
            minHeight: '200px',
        }
    }, [])

    return (
        <div className="border border-neutral-300 rounded-lg overflow-hidden" onClick={handlePreviewClick}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleImageSelection(event)}
            />
            <SimpleMDE
                value={value}
                onChange={onChange}
                options={options}
                getCodemirrorInstance={(instance) => {
                    codemirrorRef.current = instance
                }}
            />
            {isUploadingImage && (
                <div className="border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
                    Uploading image to storage...
                </div>
            )}
        </div>
    )
}
