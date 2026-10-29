// Sends a web push when a row is added to `notifications` or `messages`.
// Called by two Database Webhooks (see PUSH-SETUP.md). Secrets needed:
// VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT (mailto:you@example.com), WEBHOOK_SECRET.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC")!, Deno.env.get("VAPID_PRIVATE")!);

const ok = (m = "ok") => new Response(m, { status: 200 });
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) return new Response("no", { status: 401 });
  let body: any;
  try { body = await req.json(); } catch { return ok("bad json"); }
  const rec = body?.record;
  if (body?.type !== "INSERT" || !rec) return ok("ignored");

  let to: string, actor: string, pref: string, title = "iLike", text: string, url: string, tag: string;
  if (body.table === "messages") {
    to = rec.to_user; actor = rec.sender_id; pref = "messages";
    text = clip(String(rec.body ?? ""), 100); url = `./#dm=${actor}`; tag = `dm-${actor}`;
  } else if (body.table === "notifications") {
    to = rec.user_id; actor = rec.actor_id;
    const t = rec.type;
    // The database type is still "same" (internal name); people see "liked".
    if (t === "same") { pref = "same"; text = "liked your post"; }
    else if (t === "reply") { pref = "replies"; text = "replied to your post"; }
    else if (t === "follow") { pref = "follows"; text = "started following you"; }
    else return ok("unknown type");
    url = rec.post_id ? `./#post=${rec.post_id}` : "./"; tag = `n-${t}-${rec.post_id ?? actor}`;
  } else return ok("ignored");

  if (!to || !actor || to === actor) return ok("skip");

  // Skip if the person blocked the sender, or switched this kind off
  const [blk, prefs, who, subs] = await Promise.all([
    db.from("blocks").select("blocked_id").eq("blocker_id", to).eq("blocked_id", actor).limit(1),
    db.from("notification_prefs").select("*").eq("user_id", to).maybeSingle(),
    db.from("profiles").select("display_name").eq("id", actor).maybeSingle(),
    db.from("push_subscriptions").select("id,endpoint,p256dh,auth").eq("user_id", to),
  ]);
  if (blk.data?.length) return ok("blocked");
  if (prefs.data && prefs.data[pref] === false) return ok("off");
  if (!subs.data?.length) return ok("no devices");

  const name = who.data?.display_name || "Someone";
  const payload = JSON.stringify(
    body.table === "messages" ? { title: name, body: text!, url, tag } : { title: "iLike", body: `${name} ${text!}`, url, tag },
  );

  await Promise.all(subs.data.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400 });
    } catch (e: any) {
      // 404/410 = the phone no longer accepts pushes: forget it
      if (e?.statusCode === 404 || e?.statusCode === 410) await db.from("push_subscriptions").delete().eq("id", s.id);
      else console.error("push failed", e?.statusCode, e?.body);
    }
  }));
  return ok("sent");
});
