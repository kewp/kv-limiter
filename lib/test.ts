import limiter from "./kv_limiter.ts";

export async function should(name, config, fn, pass) {
    let passed = true;

    const kv = limiter({
        ...config,
        on_exceed: () => {
            passed = false;
        },
    });

    await fn(kv);

    if (passed !== pass) {
        console.error(
            `[${name}] test not passed, expected to ${pass ? "pass" : "fail"} but did not`,
        );
    } else {
        console.log(`[${name}] test passed`);
    }
}

export async function should_pass(name, config, fn) {
    await should(name, config, fn, true);
}

export async function should_fail(name, config, fn) {
    await should(name, config, fn, false);
}
