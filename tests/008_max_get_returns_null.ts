import { should_return_null, delay } from "../lib/test.ts";

export default async function () {
    return should_return_null(
        "008 max_get returns null",
        {
            max_get: {
                bytes: 100,
                interval_ms: 100,
            },
        },
        async (kv) => {
            await kv.reset_limits();
            await kv.set(["test_key"], "a".repeat(101));
            await kv.get(["test_key"]);
            await delay(50);
            return await kv.get(["test_key"]);
        },
    );
}
