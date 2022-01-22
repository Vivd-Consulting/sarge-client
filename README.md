# Sarge Client
Sarge tracking client, responsible for sending tracking calls to the Sarge API.

## Quickstart

Sarge automatically supports latent transactions, `sarge_ref` or `sarge_aff` URL params are stored and sent up with each event, and cleared on `puchase`. These params are set to expire after 28 days by default, though you can configure the expiry in the `init` call.

Place the init code in the `head` of your page, along with your Pixel ID:

```html
<!-- Sarge Pixel Code -->
<script>
  !function(w,d,src,n,t,s)
  {if(w.sarge)return;n=w.sarge=function(){w._invoke?
  w._invoke(arguments):n.queue.push(arguments)};
  if(!w._sarge)w._sarge=n;n.push=n;n.loaded=!0;
  n.version="2.0";n.queue=[];t=d.createElement("script");
  t.async=true;t.src=src;s=d.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(t,s)}(window,document,"sarge.js");
  
  // 123456789 is your Pixel ID
  // 28 days is the default expiry for latent data
  sarge('init', 123456789, 28);
</script>
<!-- End Sarge Pixel Code -->
```

Now in another script block, you can call events

```html
<script>
  sarge('init', 1);
</script>
```

Now you can call events:

```html
<script>
  sarge('pageView');
  sarge('atc');
  // purchase will clear sarge_ref, and sarge_aff params for next session
  sarge('purchase');
</script>
```