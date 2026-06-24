import { DurableObject } from "cloudflare:workers";

export class DurableSSE extends DurableObject<Env> {
    allEvents: Map<string, string[]>
    encoder = new TextEncoder();

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        this.allEvents = new Map()
    }

    pushData(p: string) {
        for (let [, v] of this.allEvents) {
            v.push(p)
        }
    }

    async createStream(): Promise<ReadableStream> {
        let id = crypto.randomUUID()

        const start = async (controller: ReadableStreamDefaultController) => {
            this.allEvents.set(id, [])
            controller.enqueue(this.encoder.encode(`data:${JSON.stringify({ id })}\n\n`));

            for (let _ = 1; true;) {
                await new Promise((r) => setTimeout(r, 1_000));

                let ps = this.allEvents.get(id)

                if (ps.length !== 0) {
                    let p = ps.join(',')
                    this.allEvents.set(id, [])
                    controller.enqueue(this.encoder.encode(`data:[${p}]\n\n`));
                }
            }
        }

        const cancel = () => {
            this.allEvents.delete(id)
        }

        const stream = new ReadableStream({
            start,
            cancel,
        });

        return stream
    }
}

export default {} satisfies ExportedHandler<Env>;
