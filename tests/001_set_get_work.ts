import { should_equal } from "../lib/test.ts";

export default async function () {
    return should_equal(
        "001 set/get work as per normal",
        {
            max_set: {
                bytes: 100,
                interval_ms: 100,
            },
            max_get: {
                bytes: 100,
                interval_ms: 100,
            },
        },
        async (kv) => {
            await kv.reset_limits();
            await kv.set(["test_key"], "test_value");
            return (await kv.get(["test_key"])).value;
        },
        "test_value",
    );
}
