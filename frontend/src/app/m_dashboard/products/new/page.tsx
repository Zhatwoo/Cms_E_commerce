'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ProductAddModal, { type FormData } from '../components/productAddModal';
import { useAlert } from '../../components/context/alert-context';
import { useProject } from '../../components/context/project-context';
import { type Product } from '../../lib/productsData';
import { createProduct } from '@/lib/api';
import { buildProductPayload, normalizeSubdomain } from '../lib/productUpsert';

export default function NewProductPage() {
	const router = useRouter();
	const { showAlert } = useAlert();
	const { selectedProject } = useProject();

	const subdomain = normalizeSubdomain(selectedProject?.subdomain);

	const handleSave = async (productData: Partial<Product> & Partial<FormData>) => {
		try {
			if (!subdomain) {
				showAlert('Set a subdomain for this website first to manage products.', 'Setup Required');
				return false;
			}

			const payload = buildProductPayload(productData as Partial<Product> & Record<string, unknown>);
			await createProduct({
				subdomain,
				...payload,
				slug: payload.name.toLowerCase().replace(/\s+/g, '-'),
			});

			showAlert('Product added successfully!', 'Success');
			router.push('/m_dashboard/products');
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to add product';
			showAlert(message, 'Error');
			return false;
		}
	};

	return (
		<ProductAddModal
			isOpen
			onClose={() => router.push('/m_dashboard/products')}
			onSave={handleSave}
			uploadSubdomain={subdomain || null}
			projectIndustry={selectedProject?.industry || null}
		/>
	);
}
