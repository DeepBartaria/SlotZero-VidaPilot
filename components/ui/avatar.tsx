import { cn, initials } from '@/lib/utils';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

const SIZE: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
};

/** Circular avatar with an initials fallback when no image is provided. */
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const base = cn(
    'inline-flex shrink-0 items-center justify-center rounded-full border border-slate-300 font-semibold',
    SIZE[size],
    className
  );

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatars are arbitrary remote/data URLs
      <img
        src={src}
        alt={name ? `${name} avatar` : 'User avatar'}
        className={cn(base, 'object-cover')}
      />
    );
  }

  return (
    <span className={cn(base, 'bg-slate-200 text-slate-700')} aria-hidden>
      {initials(name)}
    </span>
  );
}
