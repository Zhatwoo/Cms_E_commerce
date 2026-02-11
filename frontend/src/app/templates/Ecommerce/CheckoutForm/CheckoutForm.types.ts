export interface CheckoutFormProps {
  // Layout
  showOrderSummary?: boolean;
  summaryPosition?: "right" | "below";
  
  // Colors
  backgroundColor?: string;
  formBackgroundColor?: string;
  summaryBackgroundColor?: string;
  labelColor?: string;
  inputBackgroundColor?: string;
  inputTextColor?: string;
  inputBorderColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  priceColor?: string;
  totalPriceColor?: string;
  
  // Styling
  borderRadius?: number;
  inputBorderRadius?: number;
  buttonBorderRadius?: number;
  
  // Content
  title?: string;
  titleColor?: string;
  subtotalLabel?: string;
  shippingLabel?: string;
  taxLabel?: string;
  totalLabel?: string;
  buttonText?: string;
  
  // Values (for demo)
  subtotal?: number;
  shipping?: number;
  tax?: number;
}
