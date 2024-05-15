import { should_fail_then_pass, delay } from "../lib/test.ts";

export default async function () {
    return should_fail_then_pass(
        "007 max_get fail then pass",
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
            await delay(50);
            await kv.get(["test_key"]);
        },
        async (kv) => {
            await delay(100);
            await kv.get(["test_key"]);
        },
    );
}
