import {
  Document,
  Page,
  StyleSheet,
  Svg,
  Text,
  View,
  Defs,
  LinearGradient,
  Stop,
  Path,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Order } from "@/lib/orders";

const paymentMethodLabel: Record<string, string> = {
  "apple-pay": "Apple Pay",
  "google-pay": "Google Pay",
  visa: "Visa",
  mastercard: "Mastercard",
  paypal: "PayPal",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    color: "#111111",
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandWordmark: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
  },
  brandSubtitle: {
    fontSize: 9,
    color: "#666666",
    marginTop: 2,
  },
  invoiceMeta: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  invoiceMetaLine: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 2,
  },
  twoCol: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 32,
  },
  col: { flex: 1 },
  colLabel: {
    fontSize: 8,
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  colValue: { fontSize: 11, marginBottom: 2 },
  colValueMuted: { fontSize: 10, color: "#666666", marginBottom: 2 },
  table: { borderTop: "1pt solid #DDDDDD", marginBottom: 16 },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottom: "1pt solid #DDDDDD",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottom: "1pt solid #EEEEEE",
  },
  th: {
    fontSize: 8,
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemDescCol: { flex: 3 },
  itemQtyCol: { flex: 1, textAlign: "right" },
  itemPriceCol: { flex: 1, textAlign: "right" },
  itemTitle: { fontSize: 11, marginBottom: 2 },
  itemSubtitle: { fontSize: 9, color: "#666666" },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  totalsBlock: { width: 220 },
  totalsLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsLineFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTop: "1pt solid #111111",
    marginTop: 4,
  },
  totalsLabel: { fontSize: 10, color: "#666666" },
  totalsLabelFinal: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  totalsValue: { fontSize: 10 },
  totalsValueFinal: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#999999",
    textAlign: "center",
    borderTop: "1pt solid #EEEEEE",
    paddingTop: 12,
  },
});

function BoostLogo() {
  // The Boost icon — translated from the marketing SVG into @react-pdf/renderer
  // primitives so the PDF renders without a remote image fetch. 36×35 keeps
  // the aspect ratio (source 72×71) at half size.
  return (
    <Svg width="36" height="35" viewBox="0 0 72 71">
      <Defs>
        <LinearGradient
          id="boostFill"
          x1="36"
          y1="0"
          x2="36"
          y2="71"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#D1FF67" />
          <Stop offset="1" stopColor="#A0DE10" />
        </LinearGradient>
      </Defs>
      <Path
        d="M0 32C0 20.799 0 15.1984 2.17987 10.9202C4.09734 7.15695 7.15695 4.09734 10.9202 2.17987C15.1984 0 20.7989 0 32 0H40C51.201 0 56.8016 0 61.0798 2.17987C64.8431 4.09734 67.9027 7.15695 69.8201 10.9202C72 15.1984 72 20.799 72 32V39C72 50.201 72 55.8016 69.8201 60.0798C67.9027 63.8431 64.8431 66.9027 61.0798 68.8201C56.8016 71 51.2011 71 40 71H32C20.7989 71 15.1984 71 10.9202 68.8201C7.15695 66.9027 4.09734 63.8431 2.17987 60.0798C0 55.8016 0 50.201 0 39V32Z"
        fill="url(#boostFill)"
      />
      <Path
        d="M50.8738 37.004C50.6909 35.5043 50.2555 34.1953 49.5804 33.0578C48.6404 31.4627 47.4164 30.2363 45.9085 29.3784C44.3943 28.5142 42.7918 28.0757 41.082 28.0757C39.1956 28.0757 37.5363 28.4951 36.1167 29.353C35.6372 29.6326 35.1956 29.9503 34.7792 30.2998L36.8612 19.751L38.0095 14L28.5899 19.751V19.7764L22.1483 52.249V52.2617L21 58L30.0221 52.2617L30.6845 48.97C31.4164 50.26 32.4196 51.1941 33.7192 51.7787C35.0316 52.3634 36.5205 52.6557 38.205 52.6557C39.8896 52.6557 41.5868 52.3189 43.1325 51.6262C44.6909 50.9463 46.0536 49.9867 47.2271 48.7603C48.4006 47.5338 49.3218 46.0786 49.9968 44.4009C50.2555 43.7591 50.4511 43.0919 50.6152 42.4119C50.8738 41.2998 51 40.1306 51 38.8977C51 38.2305 50.9622 37.595 50.8738 36.9977V37.004ZM42.0978 42.4119C42.0536 42.5517 41.9905 42.6724 41.9338 42.7995C41.4543 43.7972 40.7918 44.5661 39.9464 45.1317C39.1073 45.6846 38.123 45.9642 36.9937 45.9642C35.5994 45.9642 34.5142 45.5511 33.7256 44.7314C33.1451 44.1086 32.7729 43.3524 32.6215 42.4119C32.5773 42.1069 32.5521 41.7828 32.5521 41.4396C32.5521 40.1306 32.7981 38.9676 33.2713 37.9636C33.4353 37.6141 33.6183 37.2964 33.8517 37.004C34.2366 36.4448 34.7098 35.9873 35.2713 35.6251C36.1293 35.0659 37.0946 34.7926 38.1672 34.7926C39.5867 34.7926 40.6909 35.1993 41.4669 36.0318C41.7445 36.3241 41.9653 36.6545 42.1546 37.004C42.4827 37.6586 42.6404 38.4211 42.6404 39.2981C42.6404 40.4801 42.4637 41.5095 42.0915 42.4119H42.0978Z"
        fill="#111111"
      />
    </Svg>
  );
}

export type InvoiceInput = {
  order: Order;
  buyer: { name: string | null; email: string | null };
};

export function InvoiceDocument({ order, buyer }: InvoiceInput) {
  const offer = order.offer;
  return (
    <Document
      title={`Invoice ${order.transactionId}`}
      author="Boost"
      subject={`Invoice for order ${order.transactionId}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <BoostLogo />
            <View>
              <Text style={styles.brandWordmark}>boost</Text>
              <Text style={styles.brandSubtitle}>Game-account marketplace</Text>
            </View>
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.invoiceMetaLine}>
              No. {order.transactionId}
            </Text>
            <Text style={styles.invoiceMetaLine}>
              {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Billed to</Text>
            <Text style={styles.colValue}>
              {buyer.name && buyer.name.trim().length > 0
                ? buyer.name
                : "Buyer"}
            </Text>
            {buyer.email ? (
              <Text style={styles.colValueMuted}>{buyer.email}</Text>
            ) : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Sold by</Text>
            <Text style={styles.colValue}>
              {offer?.seller.name ?? "Seller"}
            </Text>
            {offer?.seller.storeId != null ? (
              <Text style={styles.colValueMuted}>
                Store #{offer.seller.storeId}
              </Text>
            ) : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Payment</Text>
            <Text style={styles.colValue}>
              {paymentMethodLabel[order.paymentMethod] ?? order.paymentMethod}
            </Text>
            <Text style={styles.colValueMuted}>{order.status}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.itemDescCol]}>Item</Text>
            <Text style={[styles.th, styles.itemQtyCol]}>Qty</Text>
            <Text style={[styles.th, styles.itemPriceCol]}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.itemDescCol}>
              <Text style={styles.itemTitle}>
                {offer?.title ?? "Listing"}
              </Text>
              {offer ? (
                <Text style={styles.itemSubtitle}>
                  {offer.game.name} · ID {offer.id}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.colValue, styles.itemQtyCol]}>1</Text>
            <Text style={[styles.colValue, styles.itemPriceCol]}>
              €{order.price.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.totalsRow}>
          <View style={styles.totalsBlock}>
            <View style={styles.totalsLine}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                €{order.price.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalsLineFinal}>
              <Text style={styles.totalsLabelFinal}>Total paid</Text>
              <Text style={styles.totalsValueFinal}>
                €{order.price.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Boost — boost-v2-sigma.vercel.app · This receipt was generated
          automatically and is valid without a signature.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(input: InvoiceInput): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument {...input} />);
}
