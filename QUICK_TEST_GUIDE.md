# 🧪 Quick Testing Guide - Chat AI System

## ⚡ Fast Verification (5 minutes)

### 1️⃣ **Backend Health Check**
```bash
cd server
npm start
```

Open browser: `http://localhost:8080/ai/health`

**Expected:** `{"status":"ok","llm":true}`

---

### 2️⃣ **Frontend Start**
```bash
cd web_app
npm start
```

Open: `http://localhost:3000/admin/suggestions` (or your chat route)

---

### 3️⃣ **Basic Chat Flow Test**

1. **Type:** "Gợi ý 5 khách sạn Đà Nẵng"
2. **Click:** Send button (or press Enter)
3. **✅ CHECK:**
   - Input cleared immediately? ✅
   - Loading spinner appeared? ✅
   - Response received with hotels list? ✅

---

### 4️⃣ **Duplicate Prevention Test**

1. Send: "Top 5 địa danh Hà Nội"
2. Wait 1 second
3. Send same message again
4. **✅ CHECK:**
   - Warning message "Vui lòng đợi..." appears? ✅
   OR
   - Second response has "🔄 Cached" badge? ✅

---

### 5️⃣ **Error Handling Test**

1. Stop backend server (Ctrl+C)
2. Try sending message
3. **✅ CHECK:**
   - Error message displayed? ✅
   - No app crash? ✅

---

## 🔍 Deep Testing (Optional)

### **MongoDB Data Verification**

Open MongoDB Compass or Shell:
```javascript
use ChatBot
db.chatbot_test.findOne({ name: "An Giang" })
```

**Expected structure:**
```json
{
  "_id": "province_an_giang",
  "name": "An Giang",
  "places": [
    { "name": "Miếu Bà Chúa Xứ - Núi Sam" }
  ],
  "dishes": [
    { "name": "Bún cá Châu Đốc" }
  ]
}
```

If `places` or `dishes` are string arrays instead of objects, your data needs updating.

---

### **API Direct Test**

Use Postman or curl:
```bash
curl -X POST http://localhost:8080/ai/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Gợi ý 5 khách sạn Đà Nẵng",
    "use_llm": true
  }'
```

**Expected Response:**
```json
{
  "text": "...",
  "hotels": [...],
  "places": [...],
  "dishes": [...],
  "source": "sql+nosql+llm",
  "latency_ms": 250
}
```

---

### **Session Management Test**

1. Send 3 different messages
2. Click "New chat" button
3. Check sidebar - old session should appear
4. Click old session
5. **✅ CHECK:** Previous messages loaded correctly?

---

## 🐛 Troubleshooting

### **Problem: No response from AI**

**Check:**
1. Backend running? `http://localhost:8080/ai/health`
2. MongoDB connected? Check server console for "✅ Kết nối MongoDB thành công"
3. Data exists? Run MongoDB query above
4. Browser console errors? Press F12 and check Network tab

**Fix:**
```bash
# Restart backend
cd server
npm start

# Check .env file
cat .env | grep MONGO
```

---

### **Problem: Input doesn't clear**

**Check:** `AdminSuggestionsPage.jsx` line ~287:
```javascript
const onSend = async () => {
  const text = msg.trim();
  if (!text || sending) return;
  
  setMsg(''); // ← This line should be here, BEFORE sending
  
  // ... rest of code
}
```

**Fix:** Already applied in this review ✅

---

### **Problem: Duplicate messages appear**

**Check dedupe layers:**

1. **Client:** `lastSentRef.current` check (line ~270)
2. **Backend Messages:** `messages.service.js` recentMessages Map
3. **Backend AI:** `ai.controller.js` recentRequests Map

**Fix:** All layers already implemented ✅

---

### **Problem: MongoDB data structure wrong**

**Symptom:** Response has empty `places` or `dishes`

**Solution:**
```javascript
// Your data should look like:
{
  "places": [
    { "name": "Place Name" }  // ✅ CORRECT - object with .name
  ]
}

// NOT like:
{
  "places": ["Place Name"]  // ❌ WRONG - plain string
}
```

**Fix:** Update your MongoDB import script to match the correct structure.

---

## ✅ Success Criteria

- [ ] Backend starts without errors
- [ ] Frontend loads chat interface
- [ ] Can send messages and receive responses
- [ ] Input clears immediately when sending
- [ ] Duplicate prevention works (client + server)
- [ ] Loading states display correctly
- [ ] Error messages show when backend is down
- [ ] Sessions save and load correctly
- [ ] Enter key sends messages
- [ ] Hotels/places/dishes render in response

---

## 📞 Need Help?

**If all tests fail:**
1. Check server console for errors
2. Check browser console (F12) for errors
3. Verify MongoDB connection and data structure
4. Review `CHAT_AI_SYSTEM_REVIEW.md` for detailed info

**If specific feature doesn't work:**
1. Find the feature in `CHAT_AI_SYSTEM_REVIEW.md`
2. Check the code location listed
3. Verify implementation matches documentation

---

**Status After Testing:** ⬜ All Pass | ⬜ Some Fail | ⬜ Not Tested

**Date:** _______________
**Tester:** _______________
**Notes:** _______________
