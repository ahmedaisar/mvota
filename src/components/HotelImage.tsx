/** Hotel photo with an honest neutral fallback when CMS has none yet. */
export default function HotelImage({
  name,
  photo,
  className = '',
}: {
  name: string;
  photo?: string | null;
  className?: string;
}) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        loading="lazy"
        className={`object-cover ${className}`}
        onError={(e) => {
          // Broken CMS URL — fall through to the neutral tile below.
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-lagoon-100 via-sand-100 to-lagoon-200 ${className}`}
      aria-label={name}
      role="img"
    >
      <span className="font-display text-4xl font-semibold text-lagoon-700/70">{initials || '◆'}</span>
    </div>
  );
}
