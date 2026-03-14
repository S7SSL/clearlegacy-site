/* Clear Legacy — Clara AI Chat Widget */
(function() {
  var API = 'https://clearlegacy-chat-api.onrender.com/api/chat';
  var CALENDLY = 'https://calendly.com/sat-installsmart/15min';
  var history = [];
  var open = false;
  var typing = false;

  var css = `
    #cl-chat-btn {
      position:fixed;bottom:24px;right:24px;z-index:9999;
      width:56px;height:56px;border-radius:50%;
      background:#2563eb;border:none;cursor:pointer;
      box-shadow:0 4px 20px rgba(37,99,235,.45);
      display:flex;align-items:center;justify-content:center;
      transition:transform .2s,box-shadow .2s;
    }
    #cl-chat-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(37,99,235,.55)}
    #cl-chat-btn svg{width:26px;height:26px;fill:#fff}
    #cl-chat-bubble {
      position:fixed;bottom:92px;right:24px;z-index:9998;
      background:#2563eb;color:#fff;
      padding:10px 16px;border-radius:20px 20px 4px 20px;
      font-family:'Inter',sans-serif;font-size:13px;font-weight:600;
      box-shadow:0 4px 16px rgba(37,99,235,.35);
      opacity:0;transform:translateY(8px);
      transition:opacity .3s,transform .3s;pointer-events:none;
    }
    #cl-chat-bubble.show{opacity:1;transform:translateY(0)}
    #cl-chat-window {
      position:fixed;bottom:92px;right:24px;z-index:9998;
      width:360px;max-width:calc(100vw - 48px);
      height:480px;max-height:calc(100vh - 120px);
      background:#fff;border-radius:16px;
      box-shadow:0 12px 48px rgba(0,0,0,.18);
      display:flex;flex-direction:column;overflow:hidden;
      opacity:0;transform:translateY(16px) scale(.96);
      transition:opacity .25s,transform .25s;pointer-events:none;
    }
    #cl-chat-window.open{opacity:1;transform:translateY(0) scale(1);pointer-events:all}
    #cl-chat-header {
      background:#2563eb;padding:16px;
      display:flex;align-items:center;gap:12px;flex-shrink:0;
    }
    #cl-chat-header .avatar {
      width:36px;height:36px;border-radius:50%;
      background:rgba(255,255,255,.2);
      display:flex;align-items:center;justify-content:center;
      font-size:18px;
    }
    #cl-chat-header .info{flex:1}
    #cl-chat-header .name{color:#fff;font-family:'Inter',sans-serif;font-size:14px;font-weight:700}
    #cl-chat-header .status{color:rgba(255,255,255,.7);font-family:'Inter',sans-serif;font-size:12px}
    #cl-chat-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,.8);font-size:20px;line-height:1;padding:2px}
    #cl-chat-close:hover{color:#fff}
    #cl-chat-msgs {
      flex:1;overflow-y:auto;padding:16px;
      display:flex;flex-direction:column;gap:10px;
      background:#f9fafb;
    }
    .cl-msg{max-width:85%;padding:10px 14px;border-radius:16px;font-family:'Inter',sans-serif;font-size:13.5px;line-height:1.55;word-break:break-word}
    .cl-msg.user{background:#2563eb;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
    .cl-msg.bot{background:#fff;color:#1f2937;align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
    .cl-msg a{color:#2563eb;text-decoration:underline}
    .cl-msg.user a{color:rgba(255,255,255,.85)}
    .cl-typing{display:flex;gap:4px;align-items:center;padding:10px 14px;background:#fff;border-radius:16px 16px 16px 4px;align-self:flex-start;box-shadow:0 1px 4px rgba(0,0,0,.08)}
    .cl-dot{width:7px;height:7px;border-radius:50%;background:#9ca3af;animation:cl-bounce 1.2s infinite}
    .cl-dot:nth-child(2){animation-delay:.2s}
    .cl-dot:nth-child(3){animation-delay:.4s}
    @keyframes cl-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
    #cl-chat-footer{padding:12px;background:#fff;border-top:1px solid #e5e7eb;flex-shrink:0;display:flex;gap:8px}
    #cl-chat-input {
      flex:1;border:1.5px solid #e5e7eb;border-radius:10px;
      padding:9px 13px;font-family:'Inter',sans-serif;font-size:13.5px;
      outline:none;resize:none;max-height:80px;
      transition:border-color .2s;
    }
    #cl-chat-input:focus{border-color:#2563eb}
    #cl-chat-send {
      background:#2563eb;border:none;border-radius:10px;
      padding:0 14px;cursor:pointer;color:#fff;
      display:flex;align-items:center;justify-content:center;
      transition:background .2s;flex-shrink:0;
    }
    #cl-chat-send:hover{background:#1d4ed8}
    #cl-chat-send svg{width:18px;height:18px;fill:#fff}
    #cl-cal-btn{
      display:block;margin:4px 0 2px;
      background:#eff6ff;color:#2563eb;border:1.5px solid #bfdbfe;
      padding:8px 14px;border-radius:10px;font-size:13px;font-weight:700;
      text-decoration:none;text-align:center;font-family:'Inter',sans-serif;
      transition:background .2s;
    }
    #cl-cal-btn:hover{background:#dbeafe}
  `;

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Bubble
  var bubble = document.createElement('div');
  bubble.id = 'cl-chat-bubble';
  bubble.textContent = 'Questions about wills or probate?';
  document.body.appendChild(bubble);
  setTimeout(function(){ bubble.classList.add('show'); }, 2500);
  setTimeout(function(){ bubble.classList.remove('show'); }, 7000);

  // Button
  var btn = document.createElement('button');
  btn.id = 'cl-chat-btn';
  btn.setAttribute('aria-label', 'Chat with Clara');
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>';
  document.body.appendChild(btn);

  // Window
  var win = document.createElement('div');
  win.id = 'cl-chat-window';
  win.innerHTML = `
    <div id="cl-chat-header">
      <div class="avatar">✍️</div>
      <div class="info">
        <div class="name">Clara — Clear Legacy</div>
        <div class="status">Estate planning assistant · Online now</div>
      </div>
      <button id="cl-chat-close" aria-label="Close">&#x2715;</button>
    </div>
    <div id="cl-chat-msgs"></div>
    <div id="cl-chat-footer">
      <textarea id="cl-chat-input" placeholder="Ask about wills, LPAs, probate..." rows="1"></textarea>
      <button id="cl-chat-send" aria-label="Send">
        <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
      </button>
    </div>`;
  document.body.appendChild(win);

  var msgs = document.getElementById('cl-chat-msgs');

  function addMsg(text, role) {
    var div = document.createElement('div');
    div.className = 'cl-msg ' + role;
    div.innerHTML = text.replace(/\n/g, '<br>').replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function addCalendly() {
    var a = document.createElement('a');
    a.id = 'cl-cal-btn';
    a.href = CALENDLY;
    a.target = '_blank';
    a.textContent = '📅 Book a free 15-minute call';
    msgs.appendChild(a);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'cl-typing';
    div.id = 'cl-typing';
    div.innerHTML = '<div class="cl-dot"></div><div class="cl-dot"></div><div class="cl-dot"></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    var t = document.getElementById('cl-typing');
    if (t) t.remove();
  }

  async function sendMessage(text) {
    if (!text.trim() || typing) return;
    typing = true;
    addMsg(text, 'user');
    history.push({ role: 'user', content: text });
    showTyping();
    document.getElementById('cl-chat-input').value = '';
    try {
      var r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      var d = await r.json();
      removeTyping();
      var reply = d.reply || 'Sorry, something went wrong. Please try again.';
      addMsg(reply, 'bot');
      history.push({ role: 'assistant', content: reply });
      // Show Calendly button after 2+ exchanges
      if (history.filter(function(m){return m.role==='user'}).length >= 2 && !document.getElementById('cl-cal-btn')) {
        addCalendly();
      }
    } catch(e) {
      removeTyping();
      addMsg('Sorry, I\'m having trouble connecting. Please try again or <a href="' + CALENDLY + '" target="_blank">book a call</a>.', 'bot');
    }
    typing = false;
  }

  btn.addEventListener('click', function() {
    open = !open;
    bubble.classList.remove('show');
    if (open) {
      win.classList.add('open');
      if (history.length === 0) {
        setTimeout(function() {
          showTyping();
          setTimeout(function() {
            removeTyping();
            addMsg('Hi! I\'m Clara, Clear Legacy\'s estate planning assistant 👋\n\nI can help with questions about Wills, LPAs, Probate, Trusts, or inheritance tax. What\'s on your mind?', 'bot');
          }, 900);
        }, 300);
      }
      setTimeout(function(){ document.getElementById('cl-chat-input').focus(); }, 300);
    } else {
      win.classList.remove('open');
    }
  });

  document.getElementById('cl-chat-close').addEventListener('click', function(e) {
    e.stopPropagation();
    open = false;
    win.classList.remove('open');
  });

  document.getElementById('cl-chat-send').addEventListener('click', function() {
    sendMessage(document.getElementById('cl-chat-input').value);
  });

  document.getElementById('cl-chat-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(this.value);
    }
  });
})();
