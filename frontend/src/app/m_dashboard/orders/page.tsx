'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { BarChart } from '../components/analytics/BarChart';

interface Order {
    id: string;
    orderNumber: string;
    customer: {
        name: string;
        email: string;
        phone: string;
    };
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    total: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentStatus: 'paid' | 'pending' | 'failed';
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    createdAt: string;
    estimatedDelivery?: string;
    trackingNumber?: string;
}

const initialOrders: Order[] = [];

const OrderCard = ({ order, colors, onViewDetails, onUpdateStatus }: {
    order: Order;
    colors: any;
    onViewDetails: (order: Order) => void;
    onUpdateStatus: (order: Order, newStatus: Order['status']) => void;
}) => {
    const statusColors = {
        pending: '#f59e0b',
        processing: '#3b82f6',
        shipped: '#8b5cf6',
        delivered: '#10b981',
        cancelled: '#ef4444'
    };

    const paymentStatusColors = {
        paid: '#10b981',
        pending: '#f59e0b',
        failed: '#ef4444'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
        >
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-lg" style={{ color: colors.text.primary }}>
                            {order.orderNumber}
                        </h3>
                        <p className="text-sm" style={{ color: colors.text.muted }}>
                            {order.createdAt}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span
                            className="px-3 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: statusColors[order.status] }}
                        >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span
                            className="px-3 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: paymentStatusColors[order.paymentStatus] }}
                        >
                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="mb-4">
                    <p className="text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
                        {order.customer.name}
                    </p>
                    <p className="text-xs" style={{ color: colors.text.muted }}>
                        {order.customer.email}
                    </p>
                    <p className="text-xs" style={{ color: colors.text.muted }}>
                        {order.customer.phone}
                    </p>
                </div>

                {/* Items */}
                <div className="mb-4">
                    <p className="text-xs font-medium mb-2" style={{ color: colors.text.muted }}>
                        Order Items ({order.items.length})
                    </p>
                    <div className="space-y-1">
                        {order.items.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex justify-between text-xs">
                                <span style={{ color: colors.text.secondary }}>
                                    {item.quantity}x {item.name}
                                </span>
                                <span style={{ color: colors.text.primary }}>
                                    ${(item.price * item.quantity).toFixed(2)}
                                </span>
                            </div>
                        ))}
                        {order.items.length > 2 && (
                            <p className="text-xs" style={{ color: colors.text.muted }}>
                                +{order.items.length - 2} more items
                            </p>
                        )}
                    </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t mb-4" style={{ borderColor: colors.border.faint }}>
                    <span className="font-medium" style={{ color: colors.text.primary }}>
                        Total
                    </span>
                    <span className="font-bold text-lg" style={{ color: colors.text.primary }}>
                        ${order.total.toFixed(2)}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onViewDetails(order)}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors border"
                        style={{
                            borderColor: colors.border.faint,
                            color: colors.text.primary,
                            backgroundColor: 'transparent'
                        }}
                    >
                        View Details
                    </button>
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <select
                            className="px-3 py-2 rounded-lg text-sm font-medium border"
                            style={{
                                borderColor: colors.border.faint,
                                backgroundColor: colors.bg.card,
                                color: colors.text.primary
                            }}
                            onChange={(e) => {
                                const newStatus = e.target.value as Order['status'];
                                if (newStatus !== order.status) {
                                    onUpdateStatus(order, newStatus);
                                }
                            }}
                            value={order.status}
                        >
                            <option value="">Update Status</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default function OrdersPage() {
    const { colors, theme } = useTheme();
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [perPage, setPerPage] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const statuses = ['All', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    const statusColors: Record<Order['status'], string> = {
        pending: '#f59e0b',
        processing: '#3b82f6',
        shipped: '#8b5cf6',
        delivered: '#10b981',
        cancelled: '#ef4444'
    };

    const paymentStatusColors: Record<Order['paymentStatus'], string> = {
        paid: '#10b981',
        pending: '#f59e0b',
        failed: '#ef4444'
    };

    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const hasOrders = orders.length > 0;

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === 'All' || order.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
    };

    const handleUpdateStatus = (order: Order, newStatus: Order['status']) => {
        setOrders(orders.map(o =>
            o.id === order.id ? { ...o, status: newStatus } : o
        ));
    };

    const stats = {
        total: orders.length,
        totalRevenue: orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0)
    };

    const ordersMap: Record<string, number> = {};
    orders.forEach(o => {
        const d = o.createdAt;
        ordersMap[d] = (ordersMap[d] || 0) + 1;
    });
    const ordersByDate = Object.keys(ordersMap).sort().map(d => ({ label: d, value: ordersMap[d] }));

    // Aggregate revenue by date for a time-series like chart
    const revenueMap: Record<string, number> = {};
    orders.forEach(o => {
        const d = o.createdAt; // using createdAt as date label
        revenueMap[d] = (revenueMap[d] || 0) + o.total;
    });
    const revenueByDate = Object.keys(revenueMap).sort().map(d => ({ label: d, value: Math.round(revenueMap[d]) }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <section
                className="rounded-2xl border p-5 md:p-6"
                style={{
                    backgroundColor: colors.bg.card,
                    borderColor: colors.border.faint,
                    boxShadow: theme === 'dark'
                        ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 50px rgba(2,6,23,0.55)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 12px 30px rgba(15,23,42,0.12)',
                }}
            >
                <div className="relative">
                    <div
                        className="absolute -inset-x-6 -inset-y-4 rounded-3xl opacity-70 blur-2xl"
                        style={{
                            background: theme === 'dark'
                                ? 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.2), transparent 60%), radial-gradient(55% 55% at 80% 20%, rgba(14,165,233,0.16), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(16,185,129,0.14), transparent 60%)'
                                : 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.14), transparent 60%), radial-gradient(55% 55% at 80% 20%, rgba(14,165,233,0.12), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(16,185,129,0.1), transparent 60%)'
                        }}
                    />
                    <div className="relative z-10">
                        <motion.p
                            className="text-xs uppercase tracking-[0.2em] mb-2"
                            style={{ color: colors.text.muted }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            Dashboard Insights
                        </motion.p>
                        <motion.h1
                            className="text-3xl font-bold tracking-tight bg-clip-text text-transparent"
                            style={{
                                backgroundImage: theme === 'dark'
                                    ? 'linear-gradient(180deg, #ffffff 25%, #9ca3af 100%)'
                                    : 'linear-gradient(180deg, #111827 25%, #4b5563 100%)'
                            }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45 }}
                        >
                            Orders
                        </motion.h1>
                        <motion.p
                            className="mt-2 text-sm md:text-base"
                            style={{ color: colors.text.secondary }}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.08 }}
                        >
                            Manage customer orders and fulfillment
                        </motion.p>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border p-6 flex flex-col" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)' }}>
                    <h4 className="text-base font-semibold mb-6" style={{ color: colors.text.primary }}>Orders (by date)</h4>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <BarChart data={ordersByDate} colors={{ bar: '#7c3aed' }} compact={true} />
                        {!hasOrders && (
                            <p className="mt-6 text-sm" style={{ color: colors.text.muted }}>No current orders</p>
                        )}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border p-6 flex flex-col" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, boxShadow: theme === 'dark' ? '0 10px 40px rgba(2,6,23,0.3)' : '0 4px 16px rgba(0,0,0,0.08)' }}>
                    <h4 className="text-base font-semibold mb-6" style={{ color: colors.text.primary }}>Revenue (by date)</h4>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <BarChart data={revenueByDate} colors={{ bar: '#7c3aed' }} compact={true} />
                        {!hasOrders && (
                            <p className="mt-6 text-sm" style={{ color: colors.text.muted }}>No revenue available</p>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Filters + Table Controls */}
            {hasOrders && (
            <div className="flex flex-col gap-4 rounded-2xl border p-4 md:p-6" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
                <div className="w-full">
                    <input
                        type="text"
                        placeholder="Search orders by number, customer name, or email..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full px-4 py-2 rounded-lg border focus:outline-none"
                        style={{
                            backgroundColor: colors.bg.card,
                            borderColor: colors.border.faint,
                            color: colors.text.primary
                        }}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-sm whitespace-nowrap" style={{ color: colors.text.muted }}>Status:</label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 rounded-lg text-sm border"
                            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, color: colors.text.primary }}
                        >
                            <option value="All">All</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg overflow-hidden border" style={{ borderColor: colors.border.faint }}>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`px-3 py-1 text-sm transition-colors ${viewMode === 'cards' ? 'bg-white/5' : 'bg-transparent'}`}
                                style={{ color: colors.text.primary }}
                                title="Card view"
                            >
                                Cards
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1 text-sm transition-colors ${viewMode === 'table' ? 'bg-white/5' : 'bg-transparent'}`}
                                style={{ color: colors.text.primary }}
                                title="Table view"
                            >
                                Table
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <label className="text-sm whitespace-nowrap" style={{ color: colors.text.muted }}>Per page:</label>
                        <select
                            value={perPage}
                            onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="px-3 py-2 rounded-lg text-sm border"
                            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, color: colors.text.primary }}
                        >
                            {[5, 10, 15, 20].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            )}

            {hasOrders ? (
            <>
            <div className="mt-4">
                {/* Mobile: behavior depends on viewMode */}
                {viewMode === 'cards' ? (
                    <div className="md:hidden grid grid-cols-1 gap-4">
                        {paginatedOrders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                colors={colors}
                                onViewDetails={handleViewDetails}
                                onUpdateStatus={handleUpdateStatus}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="md:hidden overflow-x-auto rounded-xl border" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.card }}>
                        <table className="w-full table-fixed">
                            <colgroup>
                                <col style={{ width: '60%' }} />
                                <col style={{ width: '40%' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm break-words" style={{ color: colors.text.muted }}>Order</th>
                                    <th className="px-4 py-3 text-left text-sm break-words" style={{ color: colors.text.muted }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedOrders.map(order => (
                                    <React.Fragment key={order.id}>
                                        <tr className="border-t hover:bg-white/2 cursor-pointer" style={{ borderColor: colors.border.faint }} onClick={() => setExpandedOrderId(prev => (prev === order.id ? null : order.id))}>
                                            <td className="px-4 py-3 break-words" style={{ color: colors.text.primary }}>{order.orderNumber}</td>
                                            <td className="px-4 py-3 break-words" style={{ color: colors.text.muted }}>{order.createdAt}</td>
                                        </tr>
                                        {expandedOrderId === order.id && (
                                            <tr>
                                                <td colSpan={2} className="px-4 pb-4 pt-2 border-t" style={{ borderColor: colors.border.faint }}>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <div className="font-semibold" style={{ color: colors.text.primary }}>{order.customer.name}</div>
                                                            <div className="text-sm" style={{ color: colors.text.muted }}>{order.customer.email}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm" style={{ color: colors.text.primary }}>Items ({order.items.length})</div>
                                                            <div className="space-y-1 text-sm">
                                                                {order.items.map((it, i) => (
                                                                    <div key={i} className="flex justify-between">
                                                                        <span style={{ color: colors.text.secondary, wordBreak: 'break-word' }}>{it.quantity}x {it.name}</span>
                                                                        <span style={{ color: colors.text.primary }}>${(it.price * it.quantity).toFixed(2)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm" style={{ color: colors.text.muted }}>Change status:</label>
                                                            <select
                                                                value={order.status}
                                                                onChange={(e) => handleUpdateStatus(order, e.target.value as Order['status'])}
                                                                className="px-3 py-1 rounded-lg text-sm border"
                                                                style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, color: colors.text.primary }}
                                                            >
                                                                <option value="pending">Pending</option>
                                                                <option value="processing">Processing</option>
                                                                <option value="shipped">Shipped</option>
                                                                <option value="delivered">Delivered</option>
                                                                <option value="cancelled">Cancelled</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Desktop: either cards or table depending on viewMode */}
                {viewMode === 'cards' ? (
                    <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedOrders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                colors={colors}
                                onViewDetails={handleViewDetails}
                                onUpdateStatus={handleUpdateStatus}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="hidden md:block overflow-x-auto rounded-xl border" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.card }}>
                        <table className="w-full">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 text-left text-sm" style={{ color: colors.text.muted }}>Order</th>
                            <th className="px-4 py-3 text-left text-sm" style={{ color: colors.text.muted }}>Date</th>
                            <th className="px-4 py-3 text-left text-sm" style={{ color: colors.text.muted }}>Customer</th>
                            <th className="px-4 py-3 text-left text-sm" style={{ color: colors.text.muted }}>Status</th>
                            <th className="px-4 py-3 text-right text-sm" style={{ color: colors.text.muted }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedOrders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center" style={{ color: colors.text.muted }}>
                                    No orders found
                                </td>
                            </tr>
                        )}
                        {paginatedOrders.map(order => (
                            <tr key={order.id} className="border-t hover:bg-white/2 cursor-pointer" style={{ borderColor: colors.border.faint }} onClick={() => handleViewDetails(order)}>
                                <td className="px-4 py-3" style={{ color: colors.text.primary }}>{order.orderNumber}</td>
                                <td className="px-4 py-3" style={{ color: colors.text.muted }}>{order.createdAt}</td>
                                <td className="px-4 py-3" style={{ color: colors.text.primary }}>{order.customer.name}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className="px-3 py-1 rounded-full text-xs font-medium text-white"
                                                style={{ backgroundColor: statusColors[order.status] }}
                                            >
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </td>
                                <td className="px-4 py-3 text-right" style={{ color: colors.text.primary }}>${order.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-4 mt-4">
                <div style={{ color: colors.text.muted }}>
                    Showing {(filteredOrders.length === 0) ? 0 : (startIndex + 1)} - {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded border"
                        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, color: colors.text.primary }}
                    >Prev</button>
                    <div className="px-3 py-1 rounded text-sm" style={{ color: colors.text.primary }}>{currentPage}</div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded border"
                        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, color: colors.text.primary }}
                    >Next</button>
                </div>
            </div>
            </>
            ) : (
                <section className="text-center py-20 rounded-2xl border" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
                    <div className="mx-auto w-16 h-16 rounded-2xl border flex items-center justify-center" style={{ borderColor: colors.border.default, backgroundColor: colors.bg.elevated }}>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.text.muted }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h9m-9 5h9m-9 5h9M5 7h.01M5 12h.01M5 17h.01" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-semibold mt-5 mb-2" style={{ color: colors.text.primary }}>
                        No orders yet
                    </h3>
                    <p className="max-w-md mx-auto" style={{ color: colors.text.secondary }}>
                        No order status yet. Orders will appear here once customers start checking out.
                    </p>
                </section>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-full sm:max-w-2xl mx-2 sm:mx-0 rounded-2xl border shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.default }}
                    >
                        <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: colors.border.faint }}>
                            <h3 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
                                Order Details - {selectedOrder.orderNumber}
                            </h3>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                style={{ color: colors.text.muted }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Info Grid: 3x3 layout */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Customer Information */}
                                <div className="border rounded-lg p-4" style={{ borderColor: colors.border.faint }}>
                                    <h4 className="font-semibold mb-3 text-sm" style={{ color: colors.text.primary }}>
                                        Customer Information
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div>
                                            <span style={{ color: colors.text.muted }}>Name:</span>
                                            <p style={{ color: colors.text.primary }} className="font-medium">{selectedOrder.customer.name}</p>
                                        </div>
                                        <div>
                                            <span style={{ color: colors.text.muted }}>Email:</span>
                                            <p style={{ color: colors.text.primary }} className="font-medium break-all">{selectedOrder.customer.email}</p>
                                        </div>
                                        <div>
                                            <span style={{ color: colors.text.muted }}>Phone:</span>
                                            <p style={{ color: colors.text.primary }} className="font-medium">{selectedOrder.customer.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="border rounded-lg p-4" style={{ borderColor: colors.border.faint }}>
                                    <h4 className="font-semibold mb-3 text-sm" style={{ color: colors.text.primary }}>
                                        Shipping Address
                                    </h4>
                                    <div className="text-xs" style={{ color: colors.text.primary }}>
                                        <p className="font-medium">{selectedOrder.shippingAddress.street}</p>
                                        <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}</p>
                                        <p>{selectedOrder.shippingAddress.country}</p>
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="border rounded-lg p-4" style={{ borderColor: colors.border.faint }}>
                                    <h4 className="font-semibold mb-3 text-sm" style={{ color: colors.text.primary }}>
                                        Order Summary
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span style={{ color: colors.text.muted }}>Subtotal:</span>
                                            <span style={{ color: colors.text.primary }} className="font-medium">
                                                ${selectedOrder.total.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span style={{ color: colors.text.muted }}>Shipping:</span>
                                            <span style={{ color: colors.text.primary }} className="font-medium">Free</span>
                                        </div>
                                        <div className="flex justify-between font-semibold text-sm pt-2 border-t" style={{ borderColor: colors.border.faint }}>
                                            <span style={{ color: colors.text.primary }}>Total:</span>
                                            <span style={{ color: colors.text.primary }}>
                                                ${selectedOrder.total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Status */}
                                <div className="border rounded-lg p-4" style={{ borderColor: colors.border.faint }}>
                                    <h4 className="font-semibold mb-3 text-sm" style={{ color: colors.text.primary }}>
                                        Order Status
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div>
                                            <span style={{ color: colors.text.muted }}>Order Status:</span>
                                            <p className="mt-1">
                                                <span
                                                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                                                    style={{ backgroundColor: statusColors[selectedOrder.status] }}
                                                >
                                                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <span style={{ color: colors.text.muted }}>Payment Status:</span>
                                            <p className="mt-1">
                                                <span
                                                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                                                    style={{ backgroundColor: paymentStatusColors[selectedOrder.paymentStatus] }}
                                                >
                                                    {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="border rounded-lg p-4" style={{ borderColor: colors.border.faint }}>
                                    <h4 className="font-semibold mb-3 text-sm" style={{ color: colors.text.primary }}>
                                        Items ({selectedOrder.items.length})
                                    </h4>
                                    <div className="space-y-2 text-xs max-h-[150px] overflow-y-auto">
                                        {selectedOrder.items.map((item, index) => (
                                            <div key={index} className="border-b pb-2" style={{ borderColor: colors.border.faint }}>
                                                <p className="font-medium" style={{ color: colors.text.primary }}>
                                                    {item.name}
                                                </p>
                                                <div className="flex justify-between mt-1">
                                                    <span style={{ color: colors.text.muted }}>Qty: {item.quantity}</span>
                                                    <span style={{ color: colors.text.primary }}>${(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tracking Information */}
                                <div className="border rounded-lg p-4" style={{ borderColor: colors.border.faint }}>
                                    <h4 className="font-semibold mb-3 text-sm" style={{ color: colors.text.primary }}>
                                        Tracking Information
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        {selectedOrder.trackingNumber ? (
                                            <>
                                                <div>
                                                    <span style={{ color: colors.text.muted }}>Tracking Number:</span>
                                                    <p style={{ color: colors.text.primary }} className="font-medium">{selectedOrder.trackingNumber}</p>
                                                </div>
                                                {selectedOrder.estimatedDelivery && (
                                                    <div>
                                                        <span style={{ color: colors.text.muted }}>Est. Delivery:</span>
                                                        <p style={{ color: colors.text.primary }} className="font-medium">{selectedOrder.estimatedDelivery}</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p style={{ color: colors.text.muted }}>Not available</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}


