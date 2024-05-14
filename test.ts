import kv from './kv_limiter.ts';

await kv.set(['test_key1'], 'value');

const value = (await kv.get(['test_key1'])).value;

if (value !== 'value') {
    console.error('expected value to be "value" but got',value);
}
else {
    console.log('test passed');
}