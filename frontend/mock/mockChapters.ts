import { Chapter } from '@mytypes/types'

const mockChapters: Chapter[] = [
  // Book 1: JavaScript: The Good Parts
  {
    id: 'js-good-parts-1',
    documentId: 'javascript-good-parts',
    chapterTitle: 'Introduction to JavaScript',
    contentSnippet:
      'JavaScript is a lightweight, dynamic programming language...'
  },
  {
    id: 'js-good-parts-2',
    documentId: 'javascript-good-parts',
    chapterTitle: 'Objects',
    contentSnippet: 'Objects in JavaScript are mutable keyed collections...'
  },
  {
    id: 'js-good-parts-3',
    documentId: 'javascript-good-parts',
    chapterTitle: 'Functions',
    contentSnippet: 'Functions in JavaScript are first-class objects...'
  },

  // Book 2: Clean Code
  {
    id: 'clean-code-1',
    documentId: 'clean-code',
    chapterTitle: 'Meaningful Names',
    contentSnippet: 'Names should reveal intent and be meaningful...'
  },
  {
    id: 'clean-code-2',
    documentId: 'clean-code',
    chapterTitle: 'Functions',
    contentSnippet: 'Functions should do one thing and do it well...'
  },
  {
    id: 'clean-code-3',
    documentId: 'clean-code',
    chapterTitle: 'Comments',
    contentSnippet: 'Comments are at best a necessary evil...'
  },
  {
    id: 'clean-code-4',
    documentId: 'clean-code',
    chapterTitle: 'Formatting',
    contentSnippet: 'Code formatting is about communication...'
  },

  // Book 3: Design Patterns
  {
    id: 'design-patterns-1',
    documentId: 'design-patterns',
    chapterTitle: 'Introduction to Patterns',
    contentSnippet:
      'Design patterns are typical solutions to common problems...'
  },
  {
    id: 'design-patterns-2',
    documentId: 'design-patterns',
    chapterTitle: 'Singleton Pattern',
    contentSnippet:
      'The Singleton pattern ensures a class has only one instance...'
  },
  {
    id: 'design-patterns-3',
    documentId: 'design-patterns',
    chapterTitle: 'Observer Pattern',
    contentSnippet: 'The Observer pattern defines a one-to-many dependency...'
  },

  // Book 4: The Pragmatic Programmer
  {
    id: 'pragmatic-1',
    documentId: 'pragmatic-programmer',
    chapterTitle: 'A Pragmatic Philosophy',
    contentSnippet: 'Take responsibility for your work and career...'
  },
  {
    id: 'pragmatic-2',
    documentId: 'pragmatic-programmer',
    chapterTitle: "DRY - Don't Repeat Yourself",
    contentSnippet:
      'Every piece of knowledge must have a single representation...'
  },
  {
    id: 'pragmatic-3',
    documentId: 'pragmatic-programmer',
    chapterTitle: 'Debugging',
    contentSnippet:
      'Fix the problem, not the blame. Debugging mindset is crucial...'
  },
  {
    id: 'pragmatic-4',
    documentId: 'pragmatic-programmer',
    chapterTitle: 'Testing',
    contentSnippet:
      'Testing is not about finding bugs but about not introducing them...'
  }
]

export default mockChapters
