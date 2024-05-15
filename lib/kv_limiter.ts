const kv = await Deno.openKv();

const SET_BYTES_KEY = "kv_limiter_set_bytes";
const SET_MS_KEY = "kv_limiter_set_ms";

const GET_BYTES_KEY = "kv_limiter_get_bytes";
const GET_MS_KEY = "kv_limiter_get_ms";

/*
    get the last byte count.
    reset if interval has passed.
*/
async function get_bytes(byte_key, ms_key, interval_ms) {
    let zeroed = false;

    const set_ms = (await kv.get([ms_key])).value;
    if (set_ms) {
        const now = Date.now();
        if (now - set_ms > interval_ms) {
            await kv.set([byte_key], 0);
            await kv.set([ms_key], now);
            zeroed = true;
        }
    } else await kv.set([ms_key], Date.now());

    return zeroed ? 0 : (await kv.get([byte_key])).value;
}

export default function (limits) {
    return {
        set: async (keys, obj) => {
            if (limits.max_set) {
                const { bytes, interval_ms } = limits.max_set;
                const saved_bytes = await get_bytes(
                    SET_BYTES_KEY,
                    SET_MS_KEY,
                    interval_ms,
                );

                if (saved_bytes) {
                    const total_bytes =
                        saved_bytes + JSON.stringify(obj).length;
                    if (total_bytes > bytes) {
                        if (limits.on_exceed) {
                            await limits.on_exceed("set");
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
            if (limits.max_get) {
                const { bytes, interval_ms } = limits.max_get;

                const saved_bytes = await get_bytes(
                    GET_BYTES_KEY,
                    GET_MS_KEY,
                    interval_ms,
                );

                // the on_exceed got run last time ...
                if (saved_bytes > bytes) return;

                const _ = await kv.get(keys);

                // failure is triggered after a get
                // but subsequent gets will pass through / not happen
                // until the timer resets
                const total_bytes =
                    saved_bytes + JSON.stringify(_.value).length;

                await kv.set([GET_BYTES_KEY], total_bytes);

                if (total_bytes > bytes) {
                    if (limits.on_exceed) {
                        await limits.on_exceed("get");
                    }
                }

                return _;
            } else return await kv.get(keys);
        },

        reset_limits: async () => {
            await kv.set([SET_BYTES_KEY], 0);
            await kv.set([SET_MS_KEY], Date.now());
            await kv.set([GET_BYTES_KEY], 0);
            await kv.set([GET_MS_KEY], Date.now());
        },
    };
}
