import { delay, should_fail_then_pass } from "../lib/test.ts";

export default async function () {
    return should_fail_then_pass(
        "004 max_set fail then pass",
        {
            max_set: {
                bytes: 100,
                interval_ms: 100,
            },
        },
        async (kv) => {
            await kv.reset_limits();
            await kv.set(["test_key"], "a".repeat(98));
            await delay(50);
            await kv.set(["test_key"], "a".repeat(98));
        },
        async (kv) => {
            await delay(100);
            await kv.set(["test_key"], "a".repeat(98));
        },
    );
}
