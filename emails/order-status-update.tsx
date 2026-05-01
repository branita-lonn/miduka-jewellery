// emails/order-status-update.tsx
// Transactional email template for order status updates.

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { OrderStatus } from "@prisma/client";

interface OrderStatusUpdateEmailProps {
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  statusUrl: string;
}

const statusMessages: Record<OrderStatus, string> = {
  PLACED: "Your order has been placed successfully.",
  CONFIRMED: "Your order has been confirmed and is being prepared.",
  SHIPPED: "Your order is on its way! 🚚",
  DELIVERED: "Your order has been delivered. Enjoy your purchase! 🎉",
  CANCELLED: "Your order has been cancelled.",
};

export const OrderStatusUpdateEmail = ({
  orderNumber,
  customerName,
  status,
  statusUrl,
}: OrderStatusUpdateEmailProps) => {
  const previewText = `Your order ${orderNumber} is now ${status.toLowerCase()}.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Order Update</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            We wanted to let you know that the status of your order{" "}
            <strong>{orderNumber}</strong> has changed to:
          </Text>
          <Section style={statusSection}>
            <Text style={statusText}>{status.replace("_", " ")}</Text>
          </Section>
          <Text style={text}>{statusMessages[status]}</Text>
          <Section style={btnContainer}>
            <Button style={button} href={statusUrl}>
              Track Your Order
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            If you have any questions, feel free to reply to this email or contact
            our support team.
          </Text>
          <Text style={footer}>MiDuka — Your one-stop shop in Kenya.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderStatusUpdateEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "16px",
  maxWidth: "600px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
};

const statusSection = {
  backgroundColor: "#f4f4f4",
  borderRadius: "8px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "20px 0",
};

const statusText = {
  color: "#3b82f6",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "32px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "14px 24px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
};
