import {
    should_pass,
    should_fail,
    should_fail_then_pass,
    should_return_null,
} from "./lib/test.ts";

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

await should_pass(
    "max_set pass",
    {
        max_set: {
            bytes: 100,
            interval_ms: 100,
        },
    },
    async (kv) => {
        await kv.reset_limits();
        await kv.set(["test_key"], "a".repeat(98));
        await delay(200);
        await kv.set(["test_key"], "a".repeat(98));
    },
);

await should_fail(
    "max_set fail",
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
);

await should_fail_then_pass(
    "max_set fail then pass",
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

await should_pass(
    "max_get pass",
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

await should_fail(
    "max_get fail",
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
);

await should_fail_then_pass(
    "max_get fail then pass",
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

await should_return_null(
    "max_get returns null",
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
