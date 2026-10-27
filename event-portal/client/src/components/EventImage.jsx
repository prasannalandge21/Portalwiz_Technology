import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';

// Shows the event photo. If the link is missing or broken we show a plain placeholder instead.
export default function EventImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div className={`image-fallback ${className}`} role="img" aria-label={alt}>
        <CalendarDays size={32} />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
