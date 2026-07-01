'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductEditModal from '../../components/productEditModal';
import { type FormData } from '../../lib/productFormUtils';
import { useAlert } from '../../../components/context/alert-context';
import { useProject } from '../../../components/context/project-context';
import { type Product } from '../../../lib/productsData';
import { listProducts, updateProduct } from '@/lib/api';
import { buildProductPayload, normalizeSubdomain, toDashboardProduct } from '../../lib/productUpsert';

export default function EditProductPage() {
	const params = useParams<{ productId: string }>();
	const router = useRouter();
	const { showAlert } = useAlert();
	const { selectedProject } = useProject();

	const [loading, setLoading] = React.useState(true);
	const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);

	const productId = String(params?.productId || '').trim();
	const subdomain = normalizeSubdomain(selectedProject?.subdomain);

	React.useEffect(() => {
		if (!productId) {
			setLoading(false);
			return;
		}

		let mounted = true;
		const loadProduct = async () => {
			try {
				const response = await listProducts({
					subdomain: subdomain || undefined,
					ignoreActiveProjectScope: true,
					includeAllUsers: true,
					limit: 200,
				});

				const found = response.items.find((item) => item.id === productId);
				if (!mounted) return;
				setEditingProduct(found ? toDashboardProduct(found) : null);
			} catch (error) {
				if (!mounted) return;
				const message = error instanceof Error ? error.message : 'Failed to load product';
				showAlert(message, 'Error');
			} finally {
				if (mounted) setLoading(false);
			}
		};

		void loadProduct();
		return () => {
			mounted = false;
		};
	}, [productId, subdomain, showAlert]);

	const handleSave = async (productData: Partial<Product> & Partial<FormData>) => {
		if (!editingProduct) return false;

		try {
			const payload = buildProductPayload(productData as Partial<Product> & Record<string, unknown>);
			await updateProduct(editingProduct.id, payload);
			showAlert('Product updated successfully!', 'Success');
			router.push('/m_dashboard/products');
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to update product';
			showAlert(message, 'Error');
			return false;
		}
	};

	if (loading) {
		return <div className="p-8 text-sm text-slate-500">Loading product...</div>;
	}

	if (!editingProduct) {
		return (
			<div className="p-8 space-y-3">
				<p className="text-sm text-slate-500">Product not found.</p>
				<button
					type="button"
					className="text-sm font-semibold text-violet-600 hover:underline"
					onClick={() => router.push('/m_dashboard/products')}
				>
					Back to products
				</button>
			</div>
		);
	}

	return (
		<ProductEditModal
			isOpen
			onClose={() => router.push('/m_dashboard/products')}
			onSave={handleSave}
			editingProduct={editingProduct}
			uploadSubdomain={subdomain || null}
			projectIndustry={selectedProject?.industry || null}
		/>
	);
}
