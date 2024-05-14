const kv = await Deno.openKv();

const SET_BYTES_KEY = "kv_limiter_set_bytes";
const SET_MS_KEY = "kv_limiter_set_ms";

export default function (limits) {
    return {
        set: async (keys, obj) => {
            if (limits.max_set) {
                const { bytes, interval_ms } = limits.max_set;

                let zeroed = false;

                const set_ms = (await kv.get([SET_MS_KEY])).value;
                if (set_ms) {
                    const now = Date.now();
                    if (now - set_ms > interval_ms) {
                        await kv.set([SET_BYTES_KEY], 0);
                        await kv.set([SET_MS_KEY], now);
                        zeroed = true;
                    }
                } else await kv.set([SET_MS_KEY], Date.now());

                const set_bytes = zeroed
                    ? 0
                    : (await kv.get([SET_BYTES_KEY])).value;

                if (set_bytes) {
                    const total_bytes = set_bytes + JSON.stringify(obj).length;
                    if (total_bytes > bytes) {
                        if (limits.on_exceed) {
                            limits.on_exceed();
                        }
                        return;
                    }
                    await kv.set([SET_BYTES_KEY], total_bytes);
                } else
                    await kv.set([SET_BYTES_KEY], JSON.stringify(obj).length);
            }

            return await kv.set(keys, obj);
        },

        get: async (keys) => {
            return await kv.get(keys);
        },

        reset_limits: async () => {
            await kv.set([SET_BYTES_KEY], 0);
            await kv.set([SET_MS_KEY], Date.now());
        },
    };
}
