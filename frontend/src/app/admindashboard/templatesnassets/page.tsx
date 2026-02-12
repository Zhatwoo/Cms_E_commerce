'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSidebar } from '../components/sidebar';
import { AdminHeader } from '../components/header';
import BuiltInTemplates from './components/BuiltInTemplates';
import UserTemplates from './components/UserTemplates';

interface Template {
  id: string;
  name: string;
  category: string;
  username?: string;
  domainName?: string;
  thumbnail: string;
}

const SearchIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function TemplatesAssetsPage() {
  const [activeTab, setActiveTab] = useState<'builtin' | 'user'>('builtin');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample built-in templates
  const builtInTemplates: Template[] = [
    { id: '1', name: 'E-commerce Starter', category: 'E-commerce', thumbnail: '🛒' },
    { id: '2', name: 'Business Landing', category: 'Business', thumbnail: '💼' },
    { id: '3', name: 'Portfolio Modern', category: 'Portfolio', thumbnail: '🎨' },
    { id: '4', name: 'Blog Classic', category: 'Blog', thumbnail: '📝' },
  ];

  // Sample user-created templates
  const userTemplates: Template[] = [
    { id: '1', name: 'Custom Shop', category: 'E-commerce', username: 'Abby Lee', domainName: 'abbyshop.com', thumbnail: '🏪' },
    { id: '2', name: 'Personal Blog', category: 'Blog', username: 'Ben Ten', domainName: 'bensblog.com', thumbnail: '✍️' },
    { id: '3', name: 'Agency Site', category: 'Business', username: 'John Doe', domainName: 'johndoe.com', thumbnail: '🏢' },
  ];

  const filteredBuiltInTemplates = builtInTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUserTemplates = userTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.domainName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-2"
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  Templates & Assets Management
                </h1>
                <div className="text-sm text-gray-600 mt-1">
                  Templates & Assets Management &gt; {activeTab === 'builtin' ? 'Built-in Templates' : 'User Templates'}
                </div>
              </motion.div>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="relative max-w-sm">
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <SearchIcon />
                  </div>
                </div>

                {/* Tabs */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="flex items-center bg-gray-50 border-b border-gray-200">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab('builtin')}
                      className={`py-3 px-6 font-medium transition-all ${
                        activeTab === 'builtin'
                          ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      Built-in Templates
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab('user')}
                      className={`py-3 px-6 font-medium transition-all ${
                        activeTab === 'user'
                          ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      User Templates
                    </motion.button>
                  </div>

                  <div className="p-6 min-h-[400px]">
                    <AnimatePresence mode="wait">
                      {activeTab === 'builtin' && (
                        <BuiltInTemplates templates={filteredBuiltInTemplates} />
                      )}

                      {activeTab === 'user' && (
                        <UserTemplates templates={filteredUserTemplates} />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
