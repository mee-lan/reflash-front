import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { MarkdownEditor } from "../../components";
import MarkdownViewer from "../../components/MarkdownViewer";

export default function TeacherQuizExport() {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [markdownContent, setMarkdownContent] = useState("");
    const printRef = useRef<HTMLDivElement>(null);
    
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Generated Quiz",
        pageStyle: `
            @page {
                size: A4;
                margin: 10mm;
            }
            body {
                background-color: white;
            }
        `,
    });

    useEffect(() => {
        const state = location.state as { markdown?: string };
        if (state && state.markdown) {
            setMarkdownContent(state.markdown);
        } else {
            // Redirect back if no markdown content is found in state
            navigate('/teacher/quiz');
        }
    }, [location.state, navigate]);

    if (!markdownContent) {
        return (
            <div className="min-h-screen bg-neutral-50 center">
                <div className="spinner"></div>
            </div>
        );
    }

    // Process markdown to convert multiple empty lines into non-breaking spaces
    // This allows teachers to just hit "Enter" multiple times to create vertical space
    // without having to manually type HTML or &nbsp;
    const processedMarkdown = markdownContent.replace(/\n{3,}/g, (match) => {
        return '\n\n' + Array(match.length - 2).fill('&nbsp;\n\n').join('');
    });

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-neutral-200 shrink-0">
                <div className="container-custom py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/teacher/quiz"
                            className="text-neutral-600 hover:text-neutral-900"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h3 className="font-bold text-neutral-900">Export Quiz</h3>
                            <p className="text-sm text-neutral-600">Edit markdown to customize PDF</p>
                        </div>
                    </div>
                    <div>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                handlePrint();
                            }}
                            className="btn-primary flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Editor */}
                <div className="w-1/2 flex flex-col border-r border-neutral-200 bg-white">
                    <div className="flex-1 overflow-y-auto p-4">
                        <MarkdownEditor 
                            value={markdownContent} 
                            onChange={setMarkdownContent} 
                        />
                    </div>
                </div>

                {/* Right Panel: Preview */}
                <div className="w-1/2 bg-neutral-100 overflow-y-auto p-8 flex justify-center">
                    <div 
                        className="bg-white shadow-lg print:shadow-none w-full max-w-[210mm] min-h-[297mm] print:min-h-0 p-8 print:p-0"
                        ref={printRef}
                    >
                        <div className="text-black prose prose-neutral max-w-none prose-p:my-2 prose-ol:my-2 prose-li:my-1">
                            <MarkdownViewer content={processedMarkdown} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
