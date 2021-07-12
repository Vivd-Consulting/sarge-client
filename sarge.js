const _sarge = (() => {
  let id = null;
  let prod = true;

  const init = (_id, _prod) => {
    id = _id;
    prod = _prod;
  };

  const _consol = (level, msg) => {
    const isProd = prod === true;
    if (!isProd) {
      console[level](msg);
    }
  };

  const consol = {
    log: (msg) => _consol("log", msg),
    warn: (msg) => _consol("warn", msg),
    error: (msg) => _consol("error", msg),
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

  // "GET/POST", "[{ name, value }]", "{my: 'json'}", "log/whatever"
  const _net = ({ method, params = [{}], json, func }) => {
    const uri = prod
      ? "https://us-west2-sarge-tracking.cloudfunctions.net/sarge-blake"
      : "http://localhost:3000";

    const url = paramFormatter(`${uri}/${func}`, [
      { name: "id", value: id },
      ...params,
    ]);

    const options = {
      method,
      mode: "cors",
      cache: "no-cache",
    };

    if (json) {
      options.body = JSON.stringify(json);
      options.headers = {
        "Content-Type": "application/json",
      };
    }

    // TODO: Consider fallback GET:
    // (new Image()).src = url

    // Make fetch without awaiting the response
    fetch(url, options);
  };

  const net = {
    get: ({ func, params }) => _net({ method: "GET", params, func }),
    post: ({ func, params, json }) =>
      _net({ method: "POST", params, json, func }),
  };

  const getDate = (addDays = 0) =>
    new Date(Date.now() + addDays * 24 * 60 * 60 * 1000);

  const _cookie = ({ method = "GET", name, value }) => {
    const _method = method.toUpperCase();

    // Set our expiry to be 28 days from now (FB captures up to 28d)
    const expiry = getDate(28);

    if (_method === "GET") {
      return (
        document.cookie &&
        document.cookie.length > 0 &&
        document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${name}=`))
          .split("=")[1]
      );
    } else if (_method === "SET") {
      document.cookie = `${name}=${value}; expires=${expiry.toUTCString()}`;
    }
  };

  const cookie = {
    get: (name) => _cookie({ method: "GET", name }),
    set: (name, value) => _cookie({ method: "SET", name, value }),
  };

  const localStore = {
    get: (name) => window.localStorage.getItem(name),
    set: (name, value) => {
      window.localStorage.setItem(name, value);
    },
    remove: (name) => window.localStorage.removeItem(name),
  };

  // elm, [{name, value}]
  const _ctaAppend = (elm, params = [{}]) => {
    const href = paramFormatter(elm.href, params);
    elm.href = href;

    return elm;
  };

  const cta = {
    append: (query, params) => {
      const elm = document.querySelector(query);
      return _ctaAppend(elm, params);
    },
    appendAll: (query, params) => {
      const results = [];
      const elms = document.querySelectorAll(query);
      for (const elm of elms) {
        result.push(_ctaAppend(elm, params));
      }

      return results;
    },
  };

  // Grabs the sarge params from the URL and cookie them
  const cookieParams = () => {
    const params = new URLSearchParams(window.location.search);
    const sarge_ref = params.get("sarge_ref");
    const sarge_aff = params.get("sarge_aff");

    sarge_ref && cookie.set("sarge_ref", sarge_ref);
    sarge_aff && cookie.set("sarge_aff", sarge_aff);
  };

  // Grabs the sarge params from the URL and cookie them
  const localStoreParams = () => {
    let existingExp = localStore.get("sarge_exp");
    if (prod && existingExp) {
      existingExp = new Date(existingExp);
      // If our expiry date is in the future, count this as a latent and dont overwrite our data
      if (existingExp > Date.now()) {
        return;
      }
    }

    const params = new URLSearchParams(window.location.search);
    const sarge_ref = params.get("sarge_ref");
    const sarge_aff = params.get("sarge_aff");

    sarge_ref && localStore.set("sarge_ref", sarge_ref);
    sarge_aff && localStore.set("sarge_aff", sarge_aff);
    (sarge_ref || sarge_aff) && localStore.set("sarge_exp", getDate(28));
  };

  const cleanLocalStores = () => {
    localStore.remove("sarge_ref");
    localStore.remove("sarge_aff");
    localStore.remove("sarge_exp");
  };

  const getLocalStores = () => {
    return {
      aff: localStore.get("sarge_aff"),
      ref: localStore.get("sarge_ref"),
      exp: localStore.get("sarge_exp"),
    };
  };

  const events = {
    atc: (params) => {
      const date = new Date().toISOString();
      return net.post({
        func: "atc",
        json: { ...getLocalStores(), ...params, date },
      });
    },
    purchase: (params) => {
      // Remove local stores for next session
      cleanLocalStores();

      const date = new Date().toISOString();
      return net.post({
        func: "purchase",
        json: { ...getLocalStores(), ...params, date },
      });
    },
  };

  return {
    init,
    cta,
    net,
    consol,
    cookie,
    cookieParams,
    localStore,
    localStoreParams,
    getLocalStores,
    cleanLocalStores,
    events,
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
