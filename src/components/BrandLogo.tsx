interface BrandLogoProps {
  logoUrl?: string | null
  name?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizes = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-12 h-12" }

export function BrandLogo({ logoUrl, name, size = "md", className = "" }: BrandLogoProps) {
  const s = sizes[size]
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${s} flex-shrink-0 flex items-center justify-center`}>
        {logoUrl ? (
          <img src={logoUrl} alt={name || "Logo"} className="w-full h-full object-contain" />
        ) : (
          <img src="/logo.png" alt={name || "Honrly"} className="w-full h-full object-contain" />
        )}
      </div>
      {name && (
        <span className="font-semibold text-slate-900 truncate">{name}</span>
      )}
    </div>
  )
}
