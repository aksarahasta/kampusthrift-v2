import Image from 'next/image'

interface BrandLogoProps {
  className?: string
  alt?: string
  priority?: boolean
}

export function BrandLogo({
  className = 'h-10 w-14 object-contain',
  alt = 'Logo Kampus Thrift',
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/kampus-thrift-logo.png"
      alt={alt}
      width={128}
      height={88}
      className={className}
      priority={priority}
    />
  )
}
