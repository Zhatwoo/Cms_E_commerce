// modal na ginagamet ni user para makagawa ng bagong site, problema lang yung sa sub domain talaga hayop

'use client';
import React, { useState } from 'react';

type Props = {
  show?: boolean;
  onClose?: () => void;
  onCreate?: (data: { name: string; domain: string; template?: string }) => void;
};

export default function CreateSite({ show = false, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [template, setTemplate] = useState('Mercato Modern');

  if (!show) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: name || 'New Site', domain: domain || 'example.mercato.tools', template };
    if (onCreate) onCreate(payload);
    else console.log('CreateSite:', payload);
    if (onClose) onClose();

    // Redirect to web-builder page
    window.location.href = '/m_dashboard/web-builder';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={submit} className="relative z-10 w-full max-w-md rounded-xl p-6 bg-white dark:bg-[#111113] border" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <h3 className="text-lg font-semibold mb-3">Create a new site</h3>
        <div className="space-y-3 text-sm">
          <label className="block">
            <div className="text-xs text-muted mb-1">Site name</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="My Store" className="w-full rounded-md p-2 border" />
          </label>
          <label className="block">
            <div className="text-xs text-muted mb-1">Subdomain</div>
            <div className="flex gap-2">
              <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="mystore" className="flex-1 rounded-md p-2 border" />
              <span className="inline-flex items-center px-3 rounded-md border">.mercato.tools</span>
            </div>
          </label>
          <label className="block">
            <div className="text-xs text-muted mb-1">Start from template</div>
            <select value={template} onChange={e => setTemplate(e.target.value)} className="w-full rounded-md p-2 border text-sm">
              <option>Mercato Modern</option>
              <option>Marketplace Classic</option>
              <option>Minimal Store</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1 rounded-md border">Cancel</button>
          <button type="submit" className="px-3 py-1 rounded-md bg-blue-600 text-white">Create site</button>
        </div>
      </form>
    </div>
  );
}
