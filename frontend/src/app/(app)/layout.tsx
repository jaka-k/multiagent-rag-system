import Rail from '@components/shell/rail'

export default function AppShellLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="desk">
      <div className="app">
        <Rail />
        <div className="stage">{children}</div>
      </div>
    </div>
  )
}
