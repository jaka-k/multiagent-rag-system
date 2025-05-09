const FeatureOverlay = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-50 blur-sm select-none">
        {children}
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-xs">
        <div className="text-xl font-semibold text-black">
          🚧 In Beta Testing
        </div>
      </div>
    </div>
  )
}

export default FeatureOverlay

// TODO: Remove after presentation
