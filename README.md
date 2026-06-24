# Durable SSE
Use Cloudflare's Durable Objects to manage and send real time notifications using Server Sent Events (SSE)

## Getting Started

```
# create from template
pnpm create cloudflare@latest --template=github.com/darckfast/durable-sse

# dev
pnpx wrangler dev

# deploy
pnpx wrangler deploy
```

### Creating connection

In the browser you can use the `new EventSource("/endpoint")`, where the endpoint returns the `stream` from `.createStream()` in a response with 
the headers as shown in the example below

```ts
export default {
  async fetch(request, env, ctx): Promise<Response> {
    const stub = env.MY_DURABLE_SSE.getByName("my-sse");
    let stream = await stub.createStream()

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
  },
} satisfies ExportedHandler<Env>;
```

### Sending Data

Any other worker can send data to all connections within your durable object by using the `.pushData()` function
```ts
export default {
  async fetch(request, env, ctx): Promise<Response> {
    const stub = env.MY_DURABLE_SSE.getByName("my-sse");
    await stub.pushData(JSON.stringify({ hello_word: true }))
  },
} satisfies ExportedHandler<Env>;
```
