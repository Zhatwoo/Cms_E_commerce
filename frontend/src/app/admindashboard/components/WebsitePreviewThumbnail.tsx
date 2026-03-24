'use client';

import React, { useState, useEffect } from 'react';

type WebsitePreviewThumbnailProps = {
  domainName: string;
  borderColor: string;
  bgColor: string;
  className?: string;
};

export function WebsitePreviewThumbnail({
  domainName,
  borderColor,
  bgColor,
  className = '',
}: WebsitePreviewThumbnailProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract subdomain and build preview URL
    if (!domainName) {
      setLoading(false);
      return;
    }

    const subdomain = domainName.split('.')[0]?.toLowerCase() || '';
    if (!subdomain) {
      setLoading(false);
      return;
    }

    let url = '';
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1');
      if (isLocalhost) {
        url = `http://${subdomain}.localhost:3000/`;
      } else {
        url = `https://${subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'websitelink'}/`;
      }
    }

    setPreviewUrl(url);
    setLoading(false);
  }, [domainName]);

  if (loading || !previewUrl) {
    return (
      <div
        className={`w-full aspect-[16/10] rounded-t-lg flex flex-col items-center justify-center gap-2 ${className}`}
        style={{
          backgroundColor: bgColor,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin opacity-40" />
      </div>
    );
  }

  return (
    <div
      className={`w-full aspect-[16/10] rounded-t-lg overflow-hidden flex items-center justify-center relative bg-gradient-to-br from-blue-50 to-purple-50 ${className}`}
      style={{
        backgroundColor: bgColor,
        borderBottom: `1px solid ${borderColor}`,
      }}
    >
      <iframe
        title={`Preview of ${domainName}`}
        src={previewUrl}
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
        style={{
          pointerEvents: 'none',
          transform: 'scale(1.05)',
          transformOrigin: 'top left',
          width: '105.26%',
          height: '105.26%',
          marginTop: '-2.5%',
          marginLeft: '-2.5%',
          objectFit: 'cover',
          clipPath: 'polygon(0 0, calc(100% - 50px) 0, 100% 50px, 100% 100%, 0 100%)',
        }}
      />
    </div>
  );
}
