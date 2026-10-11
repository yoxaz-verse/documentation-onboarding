import { useEffect, useRef, useState } from 'react';

type Props = {
  videoId: string;
  title: string;
  className?: string;
};

export default function LazyVideoEmbed({ videoId, title, className }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad || !rootRef.current) return;
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px' }
    );
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={rootRef} className={className}>
      {shouldLoad ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setShouldLoad(true)} aria-label={`Load ${title}`}>
          Load video
        </button>
      )}
    </div>
  );
}
