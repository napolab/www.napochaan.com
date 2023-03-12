export default function handler() {
  return new Response(JSON.stringify({ name: "John Doe" }), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}
