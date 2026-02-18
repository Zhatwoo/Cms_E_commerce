'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { PieChart } from '../components/analytics/PieChart';
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

const mockOrders: Order[] = [
    {
        id: '1',
        orderNumber: 'ORD-2024-001',
        customer: {
            name: 'John Smith',
            email: 'john.smith@email.com',
            phone: '+1 (555) 123-4567'
        },
        items: [
            { name: 'Premium Wireless Headphones', quantity: 1, price: 299.99 },
            { name: 'Smart Watch Pro', quantity: 1, price: 449.99 }
        ],
        total: 749.98,
        status: 'shipped',
        paymentStatus: 'paid',
        shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'United States'
        },
        createdAt: '2024-01-28',
        estimatedDelivery: '2024-02-02',
        trackingNumber: 'TRK123456789'
    },
    {
        id: '2',
        orderNumber: 'ORD-2024-002',
        customer: {
            name: 'Sarah Johnson',
            email: 'sarah.j@email.com',
            phone: '+1 (555) 987-6543'
        },
        items: [
            { name: 'Organic Cotton T-Shirt', quantity: 3, price: 29.99 },
            { name: 'Leather Backpack', quantity: 1, price: 89.99 }
        ],
        total: 179.96,
        status: 'processing',
        paymentStatus: 'paid',
        shippingAddress: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zip: '90001',
            country: 'United States'
        },
        createdAt: '2024-01-29',
        estimatedDelivery: '2024-02-05'
    },
    {
        id: '3',
        orderNumber: 'ORD-2024-003',
        customer: {
            name: 'Mike Davis',
            email: 'mike.d@email.com',
            phone: '+1 (555) 456-7890'
        },
        items: [
            { name: 'Ceramic Coffee Mug Set', quantity: 2, price: 34.99 }
        ],
        total: 69.98,
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress: {
            street: '789 Pine Rd',
            city: 'Chicago',
            state: 'IL',
            zip: '60007',
            country: 'United States'
        },
        createdAt: '2024-01-30'
    },
    {
        id: '4',
        orderNumber: 'ORD-2024-004',
        customer: {
            name: 'Emma Wilson',
            email: 'emma.w@email.com',
            phone: '+1 (555) 321-6547'
        },
        items: [
            { name: 'Premium Wireless Headphones', quantity: 2, price: 299.99 }
        ],
        total: 599.98,
        status: 'delivered',
        paymentStatus: 'paid',
        shippingAddress: {
            street: '321 Elm St',
            city: 'Houston',
            state: 'TX',
            zip: '77001',
            country: 'United States'
        },
        createdAt: '2024-01-25',
        trackingNumber: 'TRK987654321'
    },
    {
        id: '5',
        orderNumber: 'ORD-2024-005',
        customer: {
            name: 'Robert Brown',
            email: 'robert.b@email.com',
            phone: '+1 (555) 654-3210'
        },
        items: [
            { name: 'Smart Watch Pro', quantity: 1, price: 449.99 }
        ],
        total: 449.99,
        status: 'cancelled',
        paymentStatus: 'failed',
        shippingAddress: {
            street: '654 Maple Dr',
            city: 'Phoenix',
            state: 'AZ',
            zip: '85001',
            country: 'United States'
        },
        createdAt: '2024-01-27'
    }
];

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
    const { colors } = useTheme();
    const [orders, setOrders] = useState<Order[]>(mockOrders);
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
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
        totalRevenue: orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0)
    };

    // Prepare chart data
    const statusChartData = [
        { label: 'Pending', value: stats.pending, color: '#f59e0b' },
        { label: 'Processing', value: stats.processing, color: '#3b82f6' },
        { label: 'Shipped', value: stats.shipped, color: '#8b5cf6' },
        { label: 'Delivered', value: stats.delivered, color: '#10b981' },
        { label: 'Cancelled', value: stats.cancelled, color: '#ef4444' }
    ];

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text.primary }}>
                        Orders
                    </h1>
                    <p className="mt-2 text-base" style={{ color: colors.text.secondary }}>
                        Manage customer orders and fulfillment
                    </p>
                </div>
            </div>

            {/* Charts Row: Pie for status, Bar for revenue per order */}
            <div className="flex flex-col md:flex-row gap-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border p-6 w-fit flex flex-col" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
                    <h4 className="text-sm font-semibold mb-4" style={{ color: colors.text.primary }}>Orders by status</h4>
                    <div className="flex flex-col items-center">
                        <PieChart data={statusChartData} size={120} />
                        <div className="mt-4 text-sm text-center" style={{ color: colors.text.muted }}>
                            <div>
                                <span className="font-semibold" style={{ color: colors.text.primary }}>Total orders:</span> <span style={{ color: colors.text.primary }}>{stats.total}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border p-6 w-fit flex flex-col" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
                    <h4 className="text-sm font-semibold mb-4" style={{ color: colors.text.primary }}>Revenue (by date)</h4>
                    <div className="flex flex-col items-center mt-6">
                        <BarChart data={revenueByDate} colors={{ bar: '#7c3aed' }} compact={true} />
                        <div className="mt-4 text-sm text-center" style={{ color: colors.text.muted }}>
                            <div>
                                <span className="font-semibold" style={{ color: colors.text.primary }}>Total revenue:</span> <span style={{ color: colors.text.primary }}>${stats.totalRevenue.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filters + Table Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-full sm:w-1/2">
                    <input
                        type="text"
                        placeholder="Search orders by number, customer name, or email..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                            backgroundColor: colors.bg.card,
                            borderColor: colors.border.faint,
                            color: colors.text.primary
                        }}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-sm" style={{ color: colors.text.muted }}>Status:</label>
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
                                className={`px-3 py-1 text-sm ${viewMode === 'cards' ? 'bg-white/5' : 'bg-transparent'}`}
                                style={{ color: colors.text.primary }}
                            >
                                Modal view
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1 text-sm ${viewMode === 'table' ? 'bg-white/5' : 'bg-transparent'}`}
                                style={{ color: colors.text.primary }}
                            >
                                Table view
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm" style={{ color: colors.text.muted }}>Per page:</label>
                        <select
                            value={perPage}
                            onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="px-2 py-1 rounded-lg text-sm border"
                            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, color: colors.text.primary }}
                        >
                            {[5, 10, 15, 20].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Responsive view: cards on small, table on md+ */}
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

            {/* Pagination */}
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


