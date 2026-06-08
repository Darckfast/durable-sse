import { DurableObject } from "cloudflare:workers";

export class DurableSSE extends DurableObject<Env> {
    studioEvents: Map<string, string[]>
    encoder = new TextEncoder();

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);

        this.studioEvents = new Map()
    }

    pushData(p: string) {
        for (let [, v] of this.studioEvents) {
            v.push(p)
        }
    }

    async createStream(): Promise<ReadableStream> {
        let id = crypto.randomUUID()

        const start = async (controller: ReadableStreamDefaultController) => {
            this.studioEvents.set(id, [])
            controller.enqueue(this.encoder.encode(`data:${JSON.stringify({ id })}\n\n`));

            for (let i = 1; true;) {
                await new Promise((r) => setTimeout(r, 1_000));

                let ps = this.studioEvents.get(id)

                if (ps.length !== 0) {
                    let p = ps.join(',')
                    this.studioEvents.set(id, [])
                    controller.enqueue(this.encoder.encode(`data:[${p}]\n\n`));
                }
            }
        }

        const cancel = () => {
            this.studioEvents.delete(id)
        }

        const stream = new ReadableStream({
            start,
            cancel,
        });

        return stream
    }
}

export default {} satisfies ExportedHandler<Env>;
