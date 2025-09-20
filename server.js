// server.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
import { createClient } from '@supabase/supabase-js';
import crypto from "crypto";

dotenv.config();
const app = express();

// ✅ Enable CORS for all routes
app.use(cors());

// ✅ Parse JSON
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const PORT = process.env.PORT || 3000;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;
const INTEGRATION_ID_ONLINE = process.env.INTEGRATION_ID_ONLINE;
const INTEGRATION_ID_CASH = process.env.INTEGRATION_ID_CASH;
const IFRAME_ID = process.env.IFRAME_ID;
// ONLINE PAYMENT
app.post("/create-online-payment", async (req, res) => {
  try {
    const {
      amount,
      firstName,
      lastName,
      email,
      phone,
      street,
      building,
      floor,
      apartment,
      postalCode,
      city,
      country,
      items, // ✅ accept items from frontend
    } = req.body;

    console.log("items", items)

    // 1. Authenticate
    const authRes = await axios.post("https://accept.paymob.com/api/auth/tokens", {
      api_key: PAYMOB_API_KEY,
    });
    const token = authRes.data.token;


    // 2. Register order with items
    const orderRes = await axios.post("https://accept.paymob.com/api/ecommerce/orders", {
      auth_token: token,
      delivery_needed: "false",
      api_source: "INVOICE",
      shipping_data: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        email: email
      },
      integrations: [
        123,
        786
      ],
      amount_cents: amount * 100,
      currency: "EGP",
      items: items || [], // ✅ pass cart items
    });
    const orderId = orderRes.data.id;

    // 3. Request payment key
    const paymentKeyRes = await axios.post("https://accept.paymob.com/api/acceptance/payment_keys", {
      auth_token: token,
      amount_cents: amount * 100,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phone,
        street: street,
        building: building,
        floor: floor,
        apartment: apartment,
        postal_code: postalCode,
        city: city,
        country: country,
        shipping_method: "NA", // required by Paymob
        state: "NA",           // required even if not used
      },
      currency: "EGP",
      integration_id: INTEGRATION_ID_ONLINE,
    });

    const paymentKey = paymentKeyRes.data.token;

    // 4. Return iframe URL
    res.json({
      iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${IFRAME_ID}?payment_token=${paymentKey}`,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Payment creation failed" });
  }
});

app.post("/paymob-callback", express.json(), (req, res) => {
  try {
    const data = req.body;

    console.log("Paymob callback received:", data);

    // 1. Extract the HMAC sent by Paymob
    const receivedHmac = req.query.hmac; // Paymob sends hmac as query param

    // 2. Construct the string to hash (fields must be concatenated in exact order!)
    const fields = [
      "amount_cents",
      "created_at",
      "currency",
      "error_occured",
      "has_parent_transaction",
      "id",
      "integration_id",
      "is_3d_secure",
      "is_auth",
      "is_capture",
      "is_refunded",
      "is_standalone_payment",
      "is_voided",
      "order.id",
      "owner",
      "pending",
      "source_data.pan",
      "source_data.sub_type",
      "source_data.type",
      "success",
    ];

    const concatenated = fields
      .map(field => {
        const parts = field.split(".");
        let value = data;
        parts.forEach(p => value = value?.[p]);
        return value ?? "";
      })
      .join("");

    // 3. Generate HMAC using your Paymob HMAC secret
    const generatedHmac = crypto
      .createHmac("sha512", PAYMOB_HMAC_SECRET)
      .update(concatenated)
      .digest("hex");

    console.log("generatedHmac", generatedHmac)

    // 4. Compare
    if (generatedHmac !== receivedHmac) {
      console.error("Invalid HMAC! Possible spoofed request");
      return res.status(400).send("Invalid HMAC");
    } 

    // 5. Handle success/failure
    if (data.success === "true") {
      // ✅ Mark order as paid
      console.log("Payment success for order:", data.order.id);
      // e.g. update DB order status to "Paid"
    } else {
      // ❌ Payment failed
      console.log("Payment failed for order:", data.order.id);
      // e.g. update DB order status to "Failed"
    }

    res.status(200).send("Callback processed");
  } catch (err) {
    console.error("Callback error:", err.message);
    res.status(500).send("Server error");
  }
});

app.post("/create-cash-payment", async (req, res) => {
  try {
    const {
      amount,
      firstName,
      lastName,
      email,
      phone,
      street,
      building,
      floor,
      apartment,
      postalCode,
      city,
      country,
      items,
    } = req.body;

    // Push order to Supabase
    console.log("items", items)
    const { data, error } = await supabase
      .from("orders") // make sure you created this table in Supabase
      .insert([
        {
          customer_name: firstName + " " + lastName,
          address: `${street}, Building: ${building}, Floor: ${floor}, Apartment: ${apartment}, ${city}, ${country}`,
          phone,
          total: amount,
          payment_method: "COD",
          status: "Pending",

          // 🔹 Store items with flavors
          items: JSON.stringify(
            items.map(item => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              amount_cents: item.price * 100,
              flavors: item.flavors
                ? item.flavors.map(f => ({
                    flavor: f.flavor.trim(),
                    quantity: f.quantity,
                    type: f.type
                  }))
                : []
            }))
          )
        }
      ])


    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ success: false, error: "Failed to save order" });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Cash payment failed" });
  }
});








app.listen(PORT, () => console.log("Server running on http://localhost:3000"));
