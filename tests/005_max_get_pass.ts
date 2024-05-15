import { should_pass, delay } from "../lib/test.ts";

export default async function () {
    return should_pass(
        "005 max_get pass",
        {
            max_get: {
                bytes: 100,
                interval_ms: 100,
            },
        },
        async (kv) => {
            await kv.reset_limits();
            await kv.set(["test_key"], "a".repeat(98));
            await kv.get(["test_key"]);
            await delay(200);
            await kv.get(["test_key"]);
        },
    );
}
