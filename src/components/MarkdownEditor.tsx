import 'easymde/dist/easymde.min.css'
import SimpleMDE from 'react-simplemde-editor'
import { useMemo } from 'react'
import type { Options } from 'easymde'

interface MarkdownEditorProps {
    value: string
    onChange: (value: string) => void
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
    const options: Options = useMemo(() => {
        return {
            spellChecker: false,
            placeholder: 'Enter markdown content here...',
            status: false,
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
                'image',          // images
                '|',
                'preview',
            ],
            minHeight: '200px',
        }
    }, [])

    return (
        <div className="border border-neutral-300 rounded-lg overflow-hidden">
            <SimpleMDE
                value={value}
                onChange={onChange}
                options={options}
            />
        </div>
    )
}