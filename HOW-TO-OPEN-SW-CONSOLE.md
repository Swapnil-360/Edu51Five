# How to Open Service Worker Console (Detailed Steps)

## Step 1: Open DevTools
- Press **F12** or **Ctrl+Shift+I**

## Step 2: Go to Application Tab
- Click the **"Application"** tab at the top (you're already here ✓)

## Step 3: Expand Service Workers
- On the **LEFT side**, you should see "Service workers"
- Click on it to expand

## Step 4: Find the Service Worker Entry
You should see:
```
http://localhost:5174/
```

With status: **#190 activated and is running** ✓

## Step 5: Open Service Worker Console
There are TWO ways:

### Option A: Right-Click Method
1. **Right-click** on the `sw.js` link (where it says "sw.js    147")
2. Select **"Open service worker in new tab"** or similar
3. A new tab opens showing the Service Worker console

### Option B: DevTools Method  
1. Look for a small **arrow icon (▶)** next to "http://localhost:5174/"
2. Click it to expand
3. You should see "sw.js" listed
4. Click on "sw.js" 
5. A new console pane opens below showing SW logs

### Option C: Using DevTools Directly
1. In the Application tab, look at the bottom
2. You should see a **"Console"** tab
3. There might be a dropdown that says "top" 
4. Click on "top" and select your service worker from the list
5. Now the console shows only Service Worker logs

---

## What You Should See

Once you have the Service Worker console open, you'll see logs like:

```
[SW STARTUP] Service Worker starting...
[SW INSTALL] Installing service worker...
[SW ACTIVATE] Activating service worker...
```

Then when you send a notification:

```
📨 [SW] Push event received
📨 [SW] Event has data: true
📨 [SW] Got text, length: 123
📨 [SW] Parsed JSON, keys: title,body,url
📨 [SW] Ready to show: { title: "Test", body: "..." }
📨 [SW] Calling showNotification...
📨 [SW] ✅ Notification shown!
```

---

## Still Can't Find It?

Try this alternative:

1. Right-click anywhere on the page
2. Select **"Inspect"** (or **"Inspect Element"**)
3. Go to **"Console"** tab
4. At the TOP of the console, there's a dropdown that says **"top"**
5. Click it and look for your service worker in the list
6. Select it
7. Now console shows ONLY Service Worker logs

---

## Quick Test

Once you have SW console open:

1. Send a test notification from admin panel
2. **Immediately watch the SW console**
3. You should see the "📨 [SW] Push event received" log appear

If you DON'T see that log:
- Service Worker is NOT receiving push events
- Problem is at FCM/browser push service level (stale endpoints)
- Solution: Force refresh subscriptions

If you DO see that log but notification doesn't appear:
- Service Worker IS receiving events
- Problem is with showNotification() call
- We need to debug the notification options
