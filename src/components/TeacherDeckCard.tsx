// Teacher Deck Card Component

import { Link } from "react-router-dom"
import type { Deck } from "../types"

export default function TeacherDeckCard({ deck }: { deck: Deck }) {
  return (
    <Link to={`/teacher/deck/${deck.id}`} className="block group">
      <div className="card hover:shadow-lg transition-all">
        <div className="card-body">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-neutral-900 group-hover:text-primary-600 transition-colors mb-1">
                {deck.title}
              </h3>
              {deck.description && (
                <p className="text-sm text-neutral-600 mb-3">{deck.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-neutral-600">
                <span>{deck.cardCount} cards</span>
                <span>•</span>
                <span>Created {new Date(deck.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  console.log('Edit deck:', deck.id)
                }}
                className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              <svg className="w-5 h-5 text-neutral-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}