import limiter from "./kv_limiter.ts";

export function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function should(name, config, fn, pass) {
    let passed = true;

    const kv = limiter({
        ...config,
        on_exceed: async () => {
            passed = false;
        },
    });

    await fn(kv);

    if (passed !== pass) {
        console.error(
            `[${name}] not ok, expected to ${pass ? "pass" : "fail"} but did not`,
        );
    } else {
        console.log(`[${name}] ok`);
    }
}

export async function should_pass(name, config, fn) {
    await should(name, config, fn, true);
}

export async function should_fail(name, config, fn) {
    await should(name, config, fn, false);
}

export async function should_fail_then_pass(name, config, fn1, fn2) {
    await should_fail(`${name} (fail)`, config, fn1);
    await should_pass(`${name} (pass)`, config, fn2);
}

export async function should_return_null(name, config, fn) {
    const kv = limiter(config);
    const result = await fn(kv);
    if (result) {
        console.error(
            `[${name}] not ok, expected to return null but did not`,
        );
    } else {
        console.log(`[${name}] ok`);
    }
}

export async function should_equal(name, config, fn, expected) {
    const kv = limiter(config);
    const result = await fn(kv);
    if (result !== expected) {
        console.error(
            `[${name}] not ok, expected ${expected} but got ${result}`,
        );
    } else {
        console.log(`[${name}] ok`);
    }
}