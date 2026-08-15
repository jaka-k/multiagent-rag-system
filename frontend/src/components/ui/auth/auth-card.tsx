import { GraduationCap } from 'lucide-react'
import React from 'react'

interface AuthCardProps {
  title: string
  sub: string
  wide?: boolean
  children: React.ReactNode
}

/** White card on the dark auth desk, with the MRAG brand header. */
export function AuthCard({ title, sub, wide, children }: AuthCardProps) {
  return (
    <div className={wide ? 'auth-card wide fade' : 'auth-card fade'}>
      <div className="auth-brand">
        <div className="brand-mark">
          <GraduationCap size={18} />
        </div>
        <span className="brand-name">
          M<b>RAG</b>
        </span>
      </div>
      <h1>{title}</h1>
      <p className="sub">{sub}</p>
      {children}
    </div>
  )
}

export function AuthField({
  label,
  ...inputProps
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div className="flbl">{label}</div>
      <input className="ta one" {...inputProps} />
    </div>
  )
}
