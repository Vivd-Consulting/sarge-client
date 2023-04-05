const _sarge = (() => {
  let id = null;
  let expiryDays = 28;
  let prod = true;

  const init = ([_id, _expiryDays, _prod]) => {
    id = _id;
    expiryDays = _expiryDays || 28;
    prod = _prod === undefined ? true : false;

    localStoreParams();
  };

  // params = "[{ name, value }]"
  const paramFormatter = (url, params = [{}]) => {
    url = new URL(url);
    // Build our URL
    if (params.length > 0) {
      for (let i = 0; i < params.length; i++) {
        const { name, value } = params[i];
        if (name && value) {
          url.searchParams.append(name, value);
        }
      }
    }

    return url.href;
  };

  // "[{ name, value }]", "log/whatever"
  const _net = ({ params = [{}], func }) => {
    const uri = prod
      ? "https://white-dawn-6379.fly.dev"
      : "http://localhost:49828";

    const url = paramFormatter(`${uri}/${func}`, [
      { name: "id", value: id },
      ...Object.keys(params).map((name) => ({ name, value: params[name] })),
    ]);

    new Image().src = url;
  };

  const net = {
    get: ({ func, params }) => _net({ params, func })
  };

  const getDate = (addDays = 0) =>
    new Date(Date.now() + addDays * 24 * 60 * 60 * 1000);

  const localStore = {
    get: (name) => window.localStorage.getItem(name),
    set: (name, value) => {
      window.localStorage.setItem(name, value);
    },
    remove: (name) => window.localStorage.removeItem(name),
  };

  // Grabs the sarge params from the URL and cookie them
  const localStoreParams = () => {
    // Always give us a new session
    localStore.set("sarge_sess", crypto.randomUUID());

    let existingExp = localStore.get("sarge_exp");
    if (prod && existingExp) {
      existingExp = new Date(existingExp);
      // If our expiry date is in the future, count this as a latent and shouldn't overwrite our old sarge data
      if (existingExp > Date.now()) {
        return;
      }
    }

    const params = new URLSearchParams(window.location.search);
    const sarge_ref = params.get("sarge_ref");
    const sarge_aff = params.get("sarge_aff");

    if (sarge_ref) {
      localStore.set("sarge_ref", sarge_ref);
    }

    if (sarge_aff) {
      localStore.set("sarge_aff", sarge_aff);
    }

    localStore.set("sarge_exp", getDate(expiryDays));
    localStore.set("sarge_user", crypto.randomUUID());
  };

  const cleanLocalStores = () => {
    localStore.remove("sarge_ref");
    localStore.remove("sarge_aff");
    localStore.remove("sarge_exp");
    localStore.remove("sarge_sess");
    localStore.remove("sarge_user");
  };

  const getLocalStores = () => {
    return {
      aff: localStore.get("sarge_aff"),
      ref: localStore.get("sarge_ref"),
      exp: localStore.get("sarge_exp"),
      sess: localStore.get("sarge_sess"),
      user: localStore.get("sarge_user"),
    };
  };

  const buildEvent = (func, [custom], shouldCleanLocalStores) => {
    const date = new Date().getTime();
    const params = { ...getLocalStores(), date };

    if (custom) {
      params.custom = JSON.stringify(custom);
    }

    if (shouldCleanLocalStores) {
      cleanLocalStores();
    }

    return net.get({
      func,
      params
    });
  }

  const events = {
    pageView: (custom) => buildEvent("pageView", custom),
    atc: (custom) => buildEvent("atc", custom),
    partialLead: (custom) => buildEvent("partialLead", custom),
    purchase: (custom) => buildEvent("purchase", custom, true),
    lead: (custom) => buildEvent("lead", custom, true)
  };

  return {
    init,
    ...events,
  };
})();

window._invoke = (args) => {
  const arr = Array.prototype.slice.call(args);
  const fn = _sarge[arr[0]];

  if (typeof fn === "function") {
    const params = arr.slice(1, arr.length);
    return fn(params);
  } else {
    const params = arr.slice(2, arr.length);
    return fn[arr[1]](params);
  }
};

for (const call of window._sarge.queue) {
  window._invoke(call);
}
