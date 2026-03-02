import Header from "./Header"
import Sidebar from "./Sidebar"

interface LayoutProps {
    children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="flex min-h-screen bg-neutral-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <Header />

                {/* Page Content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}

