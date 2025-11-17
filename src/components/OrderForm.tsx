import { useState } from "react";
import { toast } from "../hooks/use-toast";
import WHATSAPP from "@/lib/contactConfig";
import SITE from "@/lib/siteConfig";
import { db } from "@/firebase";
import { ref, push, set } from "firebase/database";
import { Dialog, DialogTrigger, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface OrderFormProps {
  productName: string;
  productId?: string;
  productUrl?: string;
  productImage?: string;
  onSubmit?: () => void;
}

export default function OrderForm({ productName, productId, productUrl, productImage, onSubmit }: OrderFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // use centralized WhatsApp number
  const whatsappNumber = WHATSAPP.numberPlain;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Open a blank popup immediately so later navigation is allowed by browsers
    // as a result of a user gesture (avoids popup blocking).
    let popup: Window | null = null;
    try {
      popup = window.open("about:blank", "_blank");
    } catch (err) {
      popup = null;
    }
    const resolvedProductUrl = productUrl ?? `${SITE.baseUrl}/product/${productId ?? encodeURIComponent(productName)}`;

    const message =
      `*Order Request*\n` +
      `Product: ${productName}\n` +
      `Product Link: ${resolvedProductUrl}\n` +
      `Product Image: ${productImage ?? 'N/A'}\n` +
      `Customer Name: ${name}\n` +
      `Customer Phone: ${phone}\n` +
      `Submitted: ${new Date().toLocaleString()}`;

    // Save order to Realtime Database
    let orderId: string | null = null;
    try {
      const ordersRef = ref(db, 'orders');
      const newOrderRef = push(ordersRef);
      orderId = newOrderRef.key;
      const orderPayload = {
        orderId,
        productId: productId ?? null,
        productName,
        productUrl: resolvedProductUrl,
        productImage: (productImage as any) ?? null,
        customerName: name,
        customerPhone: phone,
        createdAt: new Date().toISOString(),
      };
      await set(newOrderRef, orderPayload);
      toast({ title: 'Order saved', description: `Your order was saved (id: ${orderId}).`, variant: 'success' });
    } catch (err) {
      console.error('Failed to save order:', err);
      toast({ title: 'Save failed', description: 'Could not save order to database.', variant: 'destructive' });
    }

    // WhatsApp logic (open after saving)
    // Avoid embedding large data: URIs (base64) into the wa.me URL which will often break the link.
    let imageForMessage = 'N/A';
    if (productImage) {
      if (typeof productImage === 'string' && productImage.startsWith('data:')) {
        // don't include the full base64 data in the URL — reference the saved order instead
        imageForMessage = `Image uploaded to DB (order id: ${orderId ?? 'unknown'})`;
      } else {
        imageForMessage = String(productImage);
      }
    }

    const safeMessage =
      `*Order Request*\n` +
      `Product: ${productName}\n` +
      `Product Link: ${resolvedProductUrl}\n` +
      `Product Image: ${imageForMessage}\n` +
      `Customer Name: ${name}\n` +
      `Customer Phone: ${phone}\n` +
      `Order ID: ${orderId ?? 'N/A'}\n` +
      `Submitted: ${new Date().toLocaleString()}`;

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(safeMessage)}`;
    if (popup) {
      try {
        popup.location.href = url;
      } catch (err) {
        window.open(url, "_blank");
      }
    } else {
      window.open(url, "_blank");
    }

    // We no longer send emails here — the order opens in WhatsApp for admin/customer.
    setSubmitting(false);
    // Reset form fields
    setName("");
    setPhone("");
    if (onSubmit) onSubmit();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="product">Product</Label>
        <Input id="product" value={productName} disabled className="bg-gray-100" />
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      {/* Email removed - open WhatsApp directly for order */}
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Sending..." : "Submit & Send to WhatsApp"}
      </Button>
    </form>
  );
}
