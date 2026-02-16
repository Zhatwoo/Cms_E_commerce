'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
}

interface BuiltInTemplatesProps {
  templates: Template[];
}

export default function BuiltInTemplates({ templates }: BuiltInTemplatesProps) {
  return (
    <motion.div
      key="builtin"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Built-in Templates from Web Builder
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const colorMap: Record<string, { bg: string; text: string }> = {
            'E-commerce': { bg: 'bg-slate-700', text: 'E-commerce' },
            'Business': { bg: 'bg-slate-600', text: 'Business' },
            'Portfolio': { bg: 'bg-slate-500', text: 'Portfolio' },
            'Blog': { bg: 'bg-slate-400', text: 'Blog' },
          };
          const colors = colorMap[template.category] || { bg: 'bg-gray-500', text: template.category };
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col gap-3">
                <div className={`w-full h-32 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-xl font-semibold text-center">{colors.text}</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">
                    {template.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {template.category}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                  >
                    Preview
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No templates found matching your search.
        </div>
      )}
    </motion.div>
  );
}
