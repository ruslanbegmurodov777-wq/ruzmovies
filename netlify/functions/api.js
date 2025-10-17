// Netlify function to proxy API requests to Render backend
import fetch from "node-fetch";

export const handler = async (event, context) => {
  try {
    // 🔗 Render backend URL - fallback to localhost for development
    const RENDER_BACKEND_URL = process.env.RENDER_BACKEND_URL || "http://localhost:5000";

    // 🔍 Request path: remove "/.netlify/functions/api" and prepend "/api/v1" for backend compatibility
    const relativePath = event.path.replace("/.netlify/functions/api", "/api/v1");

    // 🔗 To‘liq URL hosil qilamiz
    let url = `${RENDER_BACKEND_URL}${relativePath}`;
    if (
      event.queryStringParameters &&
      Object.keys(event.queryStringParameters).length > 0
    ) {
      const queryParams = new URLSearchParams(
        event.queryStringParameters
      ).toString();
      url += `?${queryParams}`;
    }

    // 🔧 Headers
    const headers = {
      ...event.headers,
      "Content-Type": event.headers["content-type"] || "application/json",
    };
    delete headers.host;
    delete headers.connection;

    console.log("Proxying request to:", url);
    console.log("Method:", event.httpMethod);
    console.log("Headers:", JSON.stringify(headers, null, 2));

    // 📨 Backendga so‘rov yuboramiz
    const response = await fetch(url, {
      method: event.httpMethod,
      headers,
      body: ["GET", "HEAD"].includes(event.httpMethod) ? undefined : event.body,
    });

    const contentType = response.headers.get("content-type");
    const body = await response.text();

    console.log("Backend response status:", response.status);
    // Only log first 200 characters of body to avoid verbose logs
    console.log("Backend response body:", body.substring(0, 200) + (body.length > 200 ? "..." : ""));

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": contentType || "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
      body,
    };
  } catch (error) {
    console.error("Proxy error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ 
        message: "Proxy error", 
        error: error.message,
        stack: error.stack
      }),
    };
  }
};