// emails/gift-card.tsx
// Gift card delivery email template

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Img,
} from "@react-email/components";
import * as React from "react";

interface GiftCardEmailProps {
  recipientName: string;
  senderName?: string;
  code: string;
  value: number;
  expiresAt?: string;
  storeName: string;
}

export const GiftCardEmail = ({
  recipientName,
  senderName,
  code,
  value,
  expiresAt,
  storeName,
}: GiftCardEmailProps) => {
  const previewText = `Your ${storeName} gift card has arrived!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{storeName}</Heading>
          <Text style={text}>Hi {recipientName},</Text>
          <Text style={text}>
            {senderName 
              ? `${senderName} has sent you a gift card for ${storeName}!`
              : `You've received a gift card for ${storeName}!`}
          </Text>
          
          <Section style={cardContainer}>
            <Text style={valueText}>KES {value.toLocaleString()}</Text>
            <Section style={codeBox}>
              <Text style={codeText}>{code}</Text>
            </Section>
            <Text style={instructionText}>Use this code at checkout to redeem your balance.</Text>
          </Section>

          {expiresAt && (
            <Text style={footerText}>
              This gift card expires on {new Date(expiresAt).toLocaleDateString()}.
            </Text>
          )}

          <Hr style={hr} />
          <Text style={footerText}>
            Thank you for choosing {storeName}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default GiftCardEmail;

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
  maxWidth: "580px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#444444",
  fontSize: "16px",
  lineHeight: "24px",
};

const cardContainer = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "32px",
  textAlign: "center" as const,
  margin: "32px 0",
};

const valueText = {
  color: "#3b82f6",
  fontSize: "36px",
  fontWeight: "800",
  margin: "0 0 16px 0",
};

const codeBox = {
  backgroundColor: "#ffffff",
  border: "2px dashed #cbd5e1",
  borderRadius: "12px",
  padding: "16px",
  margin: "0 auto 16px auto",
  maxWidth: "300px",
};

const codeText = {
  color: "#1e293b",
  fontSize: "24px",
  fontFamily: "monospace",
  fontWeight: "700",
  letterSpacing: "2px",
  margin: "0",
};

const instructionText = {
  color: "#64748b",
  fontSize: "14px",
  margin: "0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  textAlign: "center" as const,
};
