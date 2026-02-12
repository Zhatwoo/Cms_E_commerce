import { Container } from "./Container/Container";
import { Text } from "./Text/Text";
import { Page } from "./Page/Page";
import { Viewport } from "./Viewport/Viewport";
import { Image } from "./Image/Image";
import { Button } from "./Button/Button";
import { Divider } from "./Divider/Divider";
import { Section } from "./Section/Section";
import { Row } from "./Row/Row";
import { Column } from "./Column/Column";
import { ProductListing } from "../../templates/Ecommerce/ProductListing/ProductListing";
import { ProductDetails } from "../../templates/Ecommerce/ProductDetails/ProductDetails";
import { CartLayout } from "../../templates/Ecommerce/CartLayout/CartLayout";
import { OrderTrackingLayout } from "../../templates/Ecommerce/OrderTrackingLayout/OrderTrackingLayout";

export const RenderBlocks: Record<string, any> = {
  Container,
  Text,
  Page,
  Viewport,
  Image,
  Button,
  Divider,
  Section,
  Row,
  Column,
  ProductListing,
  "Product Listing": ProductListing,
  ProductDetails,
  "Product Details": ProductDetails,
  CartLayout,
  "Cart": CartLayout,
  OrderTrackingLayout,
  "Order Tracking": OrderTrackingLayout,
};
