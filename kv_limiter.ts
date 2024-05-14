
const kv = await Deno.openKv();

async function set(keys, obj) {
    return await kv.set(keys, obj);
}
async function get(keys) {
    return await kv.get(keys);
}

export default
{
    set,
    get
}