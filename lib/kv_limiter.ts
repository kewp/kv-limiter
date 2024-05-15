const kv = await Deno.openKv();

const SET_BYTES_KEY = "kv_limiter_set_bytes";
const SET_MS_KEY = "kv_limiter_set_ms";
const GET_BYTES_KEY = "kv_limiter_get_bytes";
const GET_MS_KEY = "kv_limiter_get_ms";

// we can tell locally if we are still inside
// the ms interval ... so we can avoid a kv
// call if we're already exceeded ...
const local_count = {
    set: {
        bytes: 0,
        ms: 0,
    },
    get: {
        bytes: 0,
        ms: 0,
    },
};

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

function local_exceeded(key, bytes, interval_ms) {
    const count = local_count[key];

    if (!count.ms) {
        count.ms = Date.now();
        count.bytes = 0;
        return false;
    }
    const now = Date.now();
    if (now - count.ms < interval_ms) {
        if (count.bytes > bytes) {
            return true;
        }
    } else {
        count.ms = now;
    }

    return false;
}

export default function (limits) {
    return {
        set: async (keys, obj) => {
            if (limits.max_set) {
                const { bytes, interval_ms } = limits.max_set;
                if (local_exceeded("set", bytes, interval_ms)) return;

                const saved_bytes = await get_bytes(
                    SET_BYTES_KEY,
                    SET_MS_KEY,
                    interval_ms,
                );

                const new_bytes = JSON.stringify(obj).length;

                if (saved_bytes) {
                    const total_bytes = saved_bytes + new_bytes;
                    local_count.set.bytes = total_bytes;
                    if (total_bytes > bytes) {
                        if (limits.on_exceed) {
                            await limits.on_exceed("set");
                        }
                        return;
                    }
                    await kv.set([SET_BYTES_KEY], total_bytes);
                } else {
                    await kv.set([SET_BYTES_KEY], new_bytes);
                    local_count.set.bytes = new_bytes;
                }
            }

            return await kv.set(keys, obj);
        },

        get: async (keys) => {
            if (limits.max_get) {
                const { bytes, interval_ms } = limits.max_get;

                if (local_exceeded("get", bytes, interval_ms)) return;

                const saved_bytes = await get_bytes(
                    GET_BYTES_KEY,
                    GET_MS_KEY,
                    interval_ms,
                );

                // the on_exceed got run last time ...
                if (saved_bytes > bytes) {
                    local_count.get.bytes = saved_bytes;
                    return;
                }

                const _ = await kv.get(keys);

                // failure is triggered after a get
                // but subsequent gets will pass through / not happen
                // until the timer resets
                const total_bytes =
                    saved_bytes + JSON.stringify(_.value).length;

                await kv.set([GET_BYTES_KEY], total_bytes);
                local_count.get.bytes = total_bytes;

                if (total_bytes > bytes) {
                    if (limits.on_exceed) {
                        await limits.on_exceed("get");
                    }
                }

                return _;
            } else return await kv.get(keys);
        },

        list: (selector, options) => {
            if (limits.max_get) {
                const { bytes, interval_ms } = limits.max_get;

                const generator = async function* (selector, options) {
                    const saved_bytes = await get_bytes(
                        GET_BYTES_KEY,
                        GET_MS_KEY,
                        interval_ms,
                    );

                    if (saved_bytes > bytes) return;

                    const iterator = kv.list(selector, options);
                    let total_bytes = saved_bytes;
                    for await (const _ of iterator) {
                        total_bytes += JSON.stringify(_.value).length;
                        yield _;
                    }
                    await kv.set([GET_BYTES_KEY], total_bytes);

                    if (total_bytes > bytes) {
                        if (limits.on_exceed) {
                            await limits.on_exceed("list");
                        }
                    }
                };

                return generator(selector, options);
            } else return kv.list(keys);
        },

        reset_limits: async () => {
            await kv.set([SET_BYTES_KEY], 0);
            await kv.set([SET_MS_KEY], Date.now());
            await kv.set([GET_BYTES_KEY], 0);
            await kv.set([GET_MS_KEY], Date.now());
            local_count.set.bytes = 0;
            local_count.set.ms = 0;
            local_count.get.bytes = 0;
            local_count.get.ms = 0;
        },
    };
}
