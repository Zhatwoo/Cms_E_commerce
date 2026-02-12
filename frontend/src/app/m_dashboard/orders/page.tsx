'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';

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

    const statuses = ['All', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === 'All' || order.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: '#3b82f6' },
                    { label: 'Pending', value: stats.pending, color: '#f59e0b' },
                    { label: 'Processing', value: stats.processing, color: '#3b82f6' },
                    { label: 'Shipped', value: stats.shipped, color: '#8b5cf6' },
                    { label: 'Delivered', value: stats.delivered, color: '#10b981' },
                    { label: 'Revenue', value: `$${stats.totalRevenue.toFixed(0)}`, color: '#10b981' }
                ].map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="rounded-xl border p-4"
                        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
                    >
                        <div className="text-center">
                            <p className="text-xs font-medium mb-1" style={{ color: colors.text.muted }}>
                                {stat.label}
                            </p>
                            <p className="text-lg font-bold" style={{ color: colors.text.primary }}>
                                {stat.value}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search orders by number, customer name, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                            backgroundColor: colors.bg.card,
                            borderColor: colors.border.faint,
                            color: colors.text.primary
                        }}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {statuses.map(status => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStatus === status ? 'shadow-md' : 'hover:opacity-70'
                                }`}
                            style={{
                                backgroundColor: selectedStatus === status ? colors.bg.elevated : 'transparent',
                                color: selectedStatus === status ? colors.text.primary : colors.text.muted,
                                border: `1px solid ${selectedStatus === status ? colors.border.default : 'transparent'}`
                            }}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map((order) => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        colors={colors}
                        onViewDetails={handleViewDetails}
                        onUpdateStatus={handleUpdateStatus}
                    />
                ))}
            </div>

            {filteredOrders.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
                        No orders found
                    </h3>
                    <p style={{ color: colors.text.secondary }}>
                        Try adjusting your search or filters
                    </p>
                </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
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
                            {/* Customer Information */}
                            <div>
                                <h4 className="font-semibold mb-3" style={{ color: colors.text.primary }}>
                                    Customer Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span style={{ color: colors.text.muted }}>Name:</span>
                                        <span style={{ color: colors.text.primary }}>{selectedOrder.customer.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: colors.text.muted }}>Email:</span>
                                        <span style={{ color: colors.text.primary }}>{selectedOrder.customer.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: colors.text.muted }}>Phone:</span>
                                        <span style={{ color: colors.text.primary }}>{selectedOrder.customer.phone}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                                <h4 className="font-semibold mb-3" style={{ color: colors.text.primary }}>
                                    Shipping Address
                                </h4>
                                <div className="text-sm" style={{ color: colors.text.primary }}>
                                    {selectedOrder.shippingAddress.street}<br />
                                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}<br />
                                    {selectedOrder.shippingAddress.country}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h4 className="font-semibold mb-3" style={{ color: colors.text.primary }}>
                                    Order Items
                                </h4>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center py-2 border-b" style={{ borderColor: colors.border.faint }}>
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                                                    {item.name}
                                                </p>
                                                <p className="text-xs" style={{ color: colors.text.muted }}>
                                                    Quantity: {item.quantity}
                                                </p>
                                            </div>
                                            <p className="font-medium" style={{ color: colors.text.primary }}>
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div>
                                <h4 className="font-semibold mb-3" style={{ color: colors.text.primary }}>
                                    Order Summary
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span style={{ color: colors.text.muted }}>Subtotal:</span>
                                        <span style={{ color: colors.text.primary }}>
                                            ${selectedOrder.total.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: colors.text.muted }}>Shipping:</span>
                                        <span style={{ color: colors.text.primary }}>Free</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-base pt-2 border-t" style={{ borderColor: colors.border.faint }}>
                                        <span style={{ color: colors.text.primary }}>Total:</span>
                                        <span style={{ color: colors.text.primary }}>
                                            ${selectedOrder.total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tracking Information */}
                            {selectedOrder.trackingNumber && (
                                <div>
                                    <h4 className="font-semibold mb-3" style={{ color: colors.text.primary }}>
                                        Tracking Information
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span style={{ color: colors.text.muted }}>Tracking Number:</span>
                                            <span style={{ color: colors.text.primary }}>{selectedOrder.trackingNumber}</span>
                                        </div>
                                        {selectedOrder.estimatedDelivery && (
                                            <div className="flex justify-between">
                                                <span style={{ color: colors.text.muted }}>Estimated Delivery:</span>
                                                <span style={{ color: colors.text.primary }}>{selectedOrder.estimatedDelivery}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}


