import {
  Body,
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

interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  shippingAddress: string;
  statusUrl: string;
}

export const OrderConfirmationEmail = ({
  orderNumber = "ORD-123456",
  customerName = "John Doe",
  totalAmount = 5000,
  shippingAddress = "123 Main St, Nairobi",
  statusUrl = "https://miduka.com/checkout/success/123",
}: OrderConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your MiDuka Order {orderNumber} is Confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Order Confirmed 🎉</Heading>
          
          <Text style={text}>Hi {customerName.split(" ")[0]},</Text>
          <Text style={text}>
            Thank you for shopping with MiDuka! We've received your order and are
            getting it ready for shipment.
          </Text>

          <Section style={section}>
            <Text style={strong}>Order Number:</Text>
            <Text style={text}>{orderNumber}</Text>
            
            <Text style={strong}>Total Amount:</Text>
            <Text style={text}>KES {totalAmount.toLocaleString()}</Text>

            <Text style={strong}>Shipping Address:</Text>
            <Text style={text}>{shippingAddress}</Text>
          </Section>

          <Hr style={hr} />

          <Section style={buttonContainer}>
            <a href={statusUrl} style={button}>
              View Order Status
            </a>
          </Section>

          <Text style={footer}>
            If you have any questions, reply to this email or contact our support team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "8px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  maxWidth: "600px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "32px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "16px",
};

const strong = {
  color: "#1a1a1a",
  fontSize: "16px",
  fontWeight: "600",
  marginBottom: "4px",
};

const section = {
  backgroundColor: "#f9fafb",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "24px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "1.5",
  padding: "12px 24px",
  textDecoration: "none",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  textAlign: "center" as const,
};
